import psycopg2
import mercantile
import os
import json
from dotenv import load_dotenv

load_dotenv()
dbname = os.getenv("POSTGRES_DB")
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", "5432"))
photo_table = os.getenv("PHOTO_TABLE", "zdjecia_lotnicze")
tiles_output_dir = os.getenv("TILES_OUTPUT_DIR", "tiles")
tiles_min_zoom = int(os.getenv("TILES_MIN_ZOOM", "3"))
tiles_max_zoom = int(os.getenv("TILES_MAX_ZOOM", "12"))

# python -m backend.tiling.generate_tiles

class MVTGenerator:
    def __init__(self, db_config, table_name=photo_table, geom_column="geometry"):
        self.conn = psycopg2.connect(**db_config)
        self.table_name = table_name
        self.geom_column = geom_column

    def get_extent(self):
        """Zwraca bounding box wszystkich danych w tabeli"""
        sql = f"""
        SELECT ST_XMin(ST_Extent({self.geom_column})), 
               ST_YMin(ST_Extent({self.geom_column})), 
               ST_XMax(ST_Extent({self.geom_column})), 
               ST_YMax(ST_Extent({self.geom_column}))
        FROM {self.table_name};
        """
        with self.conn.cursor() as cur:
            cur.execute(sql)
            result = cur.fetchone()
            if result and all(result):
                return result
            else:
                raise ValueError("Nie udało się pobrać extentu danych.")


    def count_features_in_tile(self, z, x, y):
        """Liczy obiekty w danym kaflu"""
        sql = f"""
        SELECT COUNT(*)
        FROM {self.table_name}
        WHERE ST_Intersects(
            {self.geom_column},
            ST_Transform(ST_TileEnvelope(%s, %s, %s), 4326)
        );
        """
        with self.conn.cursor() as cur:
            cur.execute(sql, (z, x, y))
            return cur.fetchone()[0]
        

    def save_stats(self, out_file="stats.json"):
        sql = f"""
        SELECT 
            rok_wykonania,
            charakterystyka_przestrzenna,
            kolor,
            zrodlo_danych,
            numer_zgloszenia,
            dt_pzgik,
            data_nalotu
        FROM {self.table_name};
        """
        with self.conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
        
        stats = {
            "photo_type": {},
            "years": {},
            "color": {},
            "report_numbers": {},
            "dt_pzgik_rok_correlation": {},
            "flight_dates": {}
        }

        for rok, res, kolor, zrodlo, numer_zgloszenia, dt_pzgik, data_nalotu in rows:
            if zrodlo not in stats["photo_type"]:
                stats["photo_type"][zrodlo] = {"resolution": {}}
            try:
                numeric_res = float(res)
            except:
                numeric_res = res

            stats["photo_type"][zrodlo]["resolution"][numeric_res] = stats["photo_type"][zrodlo]["resolution"].get(numeric_res, 0) + 1
            if rok:
                stats["years"][rok] = stats["years"].get(rok, 0) + 1
            if kolor:
                stats["color"][kolor] = stats["color"].get(kolor, 0) + 1
                
            if numer_zgloszenia:
                stats["report_numbers"][numer_zgloszenia] = stats["report_numbers"].get(numer_zgloszenia, 0) + 1
            if data_nalotu:
                stats["flight_dates"][data_nalotu] = stats["flight_dates"].get(data_nalotu, 0) + 1


            if dt_pzgik and rok:
                if dt_pzgik not in stats["dt_pzgik_rok_correlation"]:
                    stats["dt_pzgik_rok_correlation"][dt_pzgik] = {}
                stats["dt_pzgik_rok_correlation"][dt_pzgik][rok] = stats["dt_pzgik_rok_correlation"][dt_pzgik].get(rok, 0) + 1
            
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)


    def get_dynamic_limit(self, n, z, max_clusters=50000):
        """Dobiera max_clusters jako procent obiektów zależnie od zoom"""
        if z <= 5:
            percent = 0.05
        elif z <= 8:
            percent = 0.3
        elif z <= 10:
            percent = 0.55
        elif z < 12:
            percent = 0.8
        else:
            return n

        return min(int(n * percent), max_clusters)


    def get_dynamic_eps(self, n): 
        """Dobiera eps zależnie od liczby obiektów"""
        if n < 500: return 5
        elif n < 15000: return 10
        elif n < 50000: return 25
        elif n < 150000: return 45
        elif n < 500000: return 70
        elif n < 1000000: return 100
        else: return 125

    def get_tile(self, z, x, y):
        """Generuje kafel MVT z dynamicznym DBSCAN lub pełnymi danymi"""
        n = self.count_features_in_tile(z, x, y)
        if n == 0:
            return None

        # Pobieranie pełnych danych dla wysokich zoomów
        if z >= 12:
            sql = f"""
            WITH mvtgeom AS (
                SELECT ST_AsMVTGeom(
                        ST_Transform({self.geom_column}, 3857),
                        ST_Transform(ST_TileEnvelope(%s, %s, %s), 3857),
                        4096, 0, true
                    ) AS geom,
                    id
                FROM {self.table_name}
                WHERE ST_Intersects(
                    {self.geom_column},
                    ST_Transform(ST_TileEnvelope(%s, %s, %s), 4326)
                )
            )
            SELECT ST_AsMVT(mvtgeom.*, 'layer', 4096, 'geom') AS tile
            FROM mvtgeom;
            """
            params = (z, x, y, z, x, y)

        else:
            # Pobieranie danych i grupowanie DBSCAN dla niższych zoomów
            eps_value = self.get_dynamic_eps(n)
            max_clusters = self.get_dynamic_limit(n, z)

            sql = f"""
            WITH clusters AS (
                SELECT 
                    COALESCE(cluster_id::text, 'single_' || id::int) AS cid,
                    ST_Transform({self.geom_column}, 3857) AS geom_3857,
                    id
                FROM (
                    SELECT 
                        {self.geom_column},
                        id,
                        ST_ClusterDBSCAN(ST_Transform({self.geom_column}, 3857), eps := {eps_value}, minpoints := 2)
                            OVER () AS cluster_id
                    FROM {self.table_name}
                    WHERE ST_Intersects(
                        {self.geom_column},
                        ST_Transform(ST_TileEnvelope(%s, %s, %s), 4326)
                    )
                ) sub
            ),

            grouped AS (
            SELECT 
                ST_Centroid(ST_Collect(geom_3857)) AS geom_3857,
                CAST(AVG(rok_wykonania) AS INTEGER) AS rok_wykonania
            FROM clusters
            JOIN {self.table_name} USING(id)
            GROUP BY cid
            ),
            limited AS (
                SELECT * 
                FROM grouped
                ORDER BY random()
                LIMIT %s
            ),
            mvtgeom AS (
                SELECT ST_AsMVTGeom(
                        geom_3857,
                        ST_Transform(ST_TileEnvelope(%s, %s, %s), 3857),
                        4096, 0, true
                    ) AS geom, rok_wykonania
                FROM limited
            )
            SELECT ST_AsMVT(mvtgeom.*, 'layer', 4096, 'geom') AS tile
            FROM mvtgeom;
            """
            params = (z, x, y, max_clusters, z, x, y)

        with self.conn.cursor() as cur:
            cur.execute(sql, params)
            result = cur.fetchone()
            if result and result[0]:
                print(f"Generated tile z={z}, x={x}, y={y}, n={n}, mode={'FULL' if z>=14 else 'CLUSTER'}")
                return result[0]
            else:
                return None


    def generate_tiles_for_extent(self, zoom_min=0, zoom_max=14):
        """Generuje kafle MVT tylko dla extentu danych"""
        minx, miny, maxx, maxy = self.get_extent()
        tiles = []

        for z in range(zoom_min, zoom_max + 1):
            ul_tile = mercantile.tile(minx, maxy, z)
            lr_tile = mercantile.tile(maxx, miny, z)

            for x in range(ul_tile.x, lr_tile.x + 1):
                for y in range(ul_tile.y, lr_tile.y + 1):
                    tile_bytes = self.get_tile(z, x, y)
                    if tile_bytes:
                        tiles.append((z, x, y, tile_bytes))
        return tiles


if __name__ == "__main__":
    db_config = {
        "host": host,
        "port": port,
        "database": dbname,
        "user": user,
        "password": password
    }

    generator = MVTGenerator(
        db_config,
        table_name=photo_table,
        geom_column="geometry"
    )
    
    tiles = generator.generate_tiles_for_extent(
        zoom_min=tiles_min_zoom,
        zoom_max=tiles_max_zoom
    )

    for z, x, y, tile_bytes in tiles:
        folder = f"{tiles_output_dir}/{z}/{x}"
        os.makedirs(folder, exist_ok=True)
        filename = f"{folder}/{y}.pbf"
        with open(filename, "wb") as f:
            f.write(tile_bytes)
    
    generator.save_stats(f"{tiles_output_dir}/stats.json")