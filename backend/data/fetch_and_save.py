import time
import os
import re
import pandas as pd
import geopandas as gpd
from dotenv import load_dotenv
from sqlalchemy import text
from concurrent.futures import ThreadPoolExecutor, as_completed
from shapely.geometry import Point

from .fetch.fetch_data_from_wfs import WFSFetcher
from .process.transform import (
    deduplicate_gdf,
    to_wgs84,
    hash_attributes_vectorized
)
from .save.save_to_postgres import PostgresSaver
from .models import PolandBbox2180

load_dotenv()
dbname = os.getenv("POSTGRES_DB")
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", "5432"))
photo_table = os.getenv("PHOTO_TABLE", "zdjecia_lotnicze")
metadata_table = os.getenv("METADATA_TABLE", "metadane")

# python -m backend.data.fetch_and_save

def extract_year_range_from_layer(layer_name: str) -> tuple[int, int] | None:
    match = re.search(r'(\d{4})-(\d{4})', layer_name)
    if match:
        return (int(match.group(1)), int(match.group(2)))
    
    match = re.search(r'(\d{4})', layer_name)
    if match:
        year = int(match.group(1))
        return (year, year)
    
    return None

def count_records_in_db(saver: PostgresSaver, table_name: str, year_start: int, year_end: int) -> int:
    try:
        with saver.engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT COUNT(*) FROM {table_name} WHERE rok_wykonania BETWEEN :year_start AND :year_end"),
                {"year_start": year_start, "year_end": year_end}
            )
            count = result.scalar()
            return count if count else 0
    except Exception as e:
        print(f"  Error counting records for years {year_start}-{year_end}: {e}")
        return 0

def fetch_bbox_parallel(
    fetcher: WFSFetcher,
    layer: str,
    bbox: tuple[float, float, float, float]
) -> gpd.GeoDataFrame | None:
    try:
        gdf = fetcher.fetch_layer_by_bbox(layer, bbox=bbox)
        if not gdf.empty:
            gdf = to_wgs84(gdf)
            return gdf
    except Exception as e:
        print(f"Error fetching bbox {bbox}: {e}")
    return None

def main():
    wfs_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ZDJ/WFS/Skorowidze_Srodki_Rzutow_Zdjec"
    db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

    fetcher = WFSFetcher(
        wfs_url,
        request_delay=1,
        retry_delay=2,
        timeout=500
    )
    saver = PostgresSaver(db_url)

    with saver.engine.begin() as conn:

        conn.execute(text(f"""
            CREATE TABLE if not exists {photo_table} (
                id BIGSERIAL PRIMARY KEY,
                gml_id TEXT,
                numer_szeregu TEXT,
                numer_zdjecia TEXT,
                rok_wykonania INTEGER,
                data_nalotu TEXT,
                charakterystyka_przestrzenna DOUBLE PRECISION,
                kolor TEXT,
                karta_pracy TEXT,
                numer_zgloszenia TEXT,
                zrodlo_danych TEXT,
                url_do_pobrania TEXT,
                dt_pzgik TEXT,
                uid TEXT,
                geometry geometry
            );
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint pc
                    JOIN pg_class pt ON pc.conrelid = pt.oid
                    WHERE pt.relname = '{photo_table}' 
                    AND pc.conname = '{photo_table}_uid_unique'
                    AND pc.contype = 'u'
                ) THEN
                    ALTER TABLE {photo_table} ADD CONSTRAINT {photo_table}_uid_unique UNIQUE(uid);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_uid_idx'
                ) THEN
                    CREATE INDEX {photo_table}_uid_idx ON {photo_table} (uid);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_geometry_idx'
                ) THEN
                    CREATE INDEX {photo_table}_geometry_idx ON {photo_table} USING GIST (geometry);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_rok_wykonania_idx'
                ) THEN
                    CREATE INDEX {photo_table}_rok_wykonania_idx ON {photo_table} (rok_wykonania);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_charakterystyka_idx'
                ) THEN
                    CREATE INDEX {photo_table}_charakterystyka_idx ON {photo_table} (charakterystyka_przestrzenna);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_kolor_idx'
                ) THEN
                    CREATE INDEX {photo_table}_kolor_idx ON {photo_table} (kolor);
                END IF;
            END$$;
        """))

        conn.execute(text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE tablename = '{photo_table}' AND indexname = '{photo_table}_zrodlo_danych_idx'
                ) THEN
                    CREATE INDEX {photo_table}_zrodlo_danych_idx ON {photo_table} (zrodlo_danych);
                END IF;
            END$$;
        """))
        
    layers = fetcher.get_layers()
    new_records_count = 0
    for i, layer in enumerate(layers):
        print(f"\nProcessing layer {i+1}/{len(layers)}: {layer}")
        start_time = time.time()
        
        expected_count = fetcher.get_feature_count(layer)
        if expected_count == 0:
            print(f"[WARNING] Layer '{layer}' has 0 features or count unavailable, skipping...")
            continue
        
        year_range = extract_year_range_from_layer(layer)
        if year_range:
            year_start, year_end = year_range
            year_display = f"{year_start}-{year_end}" if year_start != year_end else str(year_start)
            existing_count = count_records_in_db(saver, photo_table, year_start, year_end)
            print(f"Database already has {existing_count:,} records for layer {layer}")
            
            if existing_count == expected_count:
                print(f"Layer already complete in database, skipping fetch")
                elapsed = time.time() - start_time
                continue
            elif existing_count > 0:
                print(f"Partial data exists ({existing_count:,}/{expected_count:,}), fetching missing records...")
        
        bbox_generator = PolandBbox2180()
        optimal_step = bbox_generator.calculate_optimal_step(expected_count)
        bboxes = bbox_generator.generate_bboxes(custom_step=optimal_step)
        print(f"Using bbox step size: {optimal_step:,}m (generating {len(bboxes)} bboxes)")
        
        layer_gdfs = []
        
        max_workers = min(4, len(bboxes))
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_bbox = {
                executor.submit(fetch_bbox_parallel, fetcher, layer, bbox): bbox 
                for bbox in bboxes
            }
            
            for future in as_completed(future_to_bbox):
                bbox = future_to_bbox[future]
                try:
                    gdf = future.result()
                    if gdf is not None:
                        layer_gdfs.append(gdf)
                except Exception as e:
                    print(f"Failed to process bbox {bbox}: {e}")

        if layer_gdfs:
            print(f"Combining {len(layer_gdfs)} bbox results...")
            full_gdf = pd.concat(layer_gdfs, ignore_index=True)
            

            dtype_mapping = {
                'rok_wykonania': 'int32',
                'charakterystyka_przestrzenna': 'float64',
            }
            
            for col, dtype in dtype_mapping.items():
                if col in full_gdf.columns:
                    old_dtype = full_gdf[col].dtype
                    full_gdf[col] = full_gdf[col].astype(dtype)
            
            def normalize_geometry(geom):
                if isinstance(geom, Point):
                    return Point(round(geom.x, 5), round(geom.y, 5))
                return geom

            full_gdf['geometry'] = full_gdf['geometry'].apply(normalize_geometry)
            
            del layer_gdfs
            
            exclude_from_hash = ['uid', 'id', 'gml_id', 'dt_pzgik']
            
            print(f"Computing hashes for {len(full_gdf)} records...")
            full_gdf['uid'] = hash_attributes_vectorized(full_gdf, exclude_columns=exclude_from_hash)
            full_gdf = deduplicate_gdf(full_gdf, hash_column='uid')
            
            fetched_count = len(full_gdf)
            print(f"After deduplication: {fetched_count:,} unique records")
            
            if fetched_count != expected_count:
                diff = abs(fetched_count - expected_count)
                diff_percent = (diff / expected_count * 100) if expected_count > 0 else 0
                print(f"[WARNING] Feature count mismatch!")
                print(f"     Expected: {expected_count:,}")
                print(f"     Fetched:         {fetched_count:,}")
                print(f"     Difference:      {diff:,} ({diff_percent:.2f}%)")
                
                if fetched_count < expected_count:
                    missing = expected_count - fetched_count
                    print(f"[WARNING] Missing {missing:,} features - some data may not have been fetched!")
                else:
                    extra = fetched_count - expected_count
                    print(f"[WARNING] Found {extra:,} extra features (possibly duplicates from bbox overlaps)")
            else:
                print(f"[INFO] Feature count matches WFS: {fetched_count:,}")

            print(f"Saving {len(full_gdf)} records to database...")
            
            chunk_size = 10000


            if len(full_gdf) > chunk_size:
                print(f"Processing in chunks of {chunk_size} records...")
                for i in range(0, len(full_gdf), chunk_size):
                    chunk = full_gdf.iloc[i:i+chunk_size]
                    print(f"Processing chunk {i//chunk_size + 1}/{(len(full_gdf)-1)//chunk_size + 1}")
                    inserted = saver.append_unique_chunk_sql(chunk, table_name=photo_table)
                    new_records_count += inserted
            else:
                new_records_count = saver.append_unique_chunk_sql(full_gdf, table_name=photo_table)

            
            elapsed = time.time() - start_time
            print(f"Layer {layer} completed in {elapsed:.2f} seconds")
        else:
            print(f"No data found for layer {layer}")

    saver.update_metadata_table(
        table_name=photo_table,
        new_count=new_records_count,
        metadata_table=metadata_table
    )
    
    return new_records_count

if __name__ == "__main__":
    main()
