
import geopandas as gpd
from datetime import datetime
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.types import Text, Integer, DOUBLE_PRECISION, BIGINT

class PostgresSaver:
    def __init__(self, db_url):
        self.engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
                "application_name": "wfs_data_loader",
                "options": "-c synchronous_commit=off"
            }
        )
    
    def append_unique_chunk_sql(self, gdf_chunk: gpd.GeoDataFrame, table_name: str) -> int:
        with self.engine.connect() as conn:
            max_id = conn.execute(text(f"SELECT COALESCE(MAX(id),0) FROM {table_name}")).scalar()
        gdf_chunk = gdf_chunk.reset_index(drop=True)
        gdf_chunk['id'] = range(max_id + 1, max_id + 1 + len(gdf_chunk))

        dtype_mapping = { 
            'id': BIGINT, 
            'gml_id': Text,
            'numer_szeregu': Text,
            'numer_zdjecia': Text,
            'rok_wykonania': Integer, 
            'data_nalotu': Text,
            'charakterystyka_przestrzenna': DOUBLE_PRECISION, 
            'kolor': Text,
            'karta_pracy': Text,
            'numer_zgloszenia': Text,
            'zrodlo_danych': Text,
            'url_do_pobrania': Text,
            'dt_pzgik': Text,
            'uid': Text 
        }
        dtype = {col: dtype_mapping[col] for col in gdf_chunk.columns if col in dtype_mapping}

        temp_table = f"{table_name}_tmp"
        gdf_chunk.to_postgis(temp_table, self.engine, if_exists="replace", index=False, dtype=dtype)

        with self.engine.begin() as conn:
            total_records = len(gdf_chunk)
            
            columns = [col for col in gdf_chunk.columns if col != 'geometry']
            columns_str = ", ".join(columns)
            
            result = conn.execute(text(f"""
                INSERT INTO {table_name} ({columns_str}, geometry)
                SELECT {columns_str}, geometry
                FROM {temp_table}
                ON CONFLICT (uid) DO NOTHING;
            """))
            
            inserted_records = result.rowcount
            duplicate_records = total_records - inserted_records
            
            if duplicate_records > 0:
                print(f"Skipping {duplicate_records} duplicate records from chunk for layer '{table_name}' (inserted {inserted_records} new records)")
            
            conn.execute(text(f"DROP TABLE {temp_table}"))
        return inserted_records
            
    def update_metadata_table(
        self,
        table_name: str,
        new_count: int | None = None,
        metadata_table: str = "db_metadane"
    ):
        """
        Aktualizuje tabelę metadanych dla warstwy.

        Args:
            table_name: nazwa tabeli z danymi (np. 'zdjecia_lotnicze')
            new_count: liczba nowych rekordów przy tej aktualizacji
            metadata_table: nazwa tabeli z metadanymi (default 'metadata')
        """
        with self.engine.begin() as conn:
            conn.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {metadata_table} (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    records_count BIGINT,
                    last_update TIMESTAMP,
                    new_count BIGINT,
                    convex_hull_area DOUBLE PRECISION
                );
            """))

            records_count = conn.execute(
                text(f"SELECT COUNT(*) FROM {table_name}")
            ).scalar()

            convex_hull_area = conn.execute(text(f"""
                WITH local_hulls AS (
                    SELECT ST_ConvexHull(ST_Collect(geometry)) AS hull_geom
                    FROM {table_name}
                ),
                final_hull AS (
                    SELECT ST_ConvexHull(ST_Collect(hull_geom)) AS geom
                    FROM local_hulls
                )
                SELECT ST_Area(ST_Transform(geom, 2180)) / 1e6 AS hull_km2
                FROM final_hull;
            """)).scalar()

            conn.execute(text(f"""
                INSERT INTO {metadata_table} (
                    table_name, records_count, last_update, new_count, convex_hull_area
                )
                VALUES (
                    :table_name, :records_count, :last_update, :new_count, :convex_hull_area
                )
            """), {
                "table_name": table_name,
                "records_count": records_count,
                "last_update": datetime.now(),
                "new_count": new_count,
                "convex_hull_area": convex_hull_area
            })

            print(f"Metadata updated for '{table_name}': {records_count} records, convex hull area {convex_hull_area:.2f} km²")
