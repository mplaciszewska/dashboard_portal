
from .fetch.fetch_data_from_wfs import WFSFetcher
from .process.transform import deduplicate_gdf, to_wgs84, hash_attributes_vectorized
from .save.save_to_postgres import PostgresSaver
import pandas as pd
from sqlalchemy import text
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from ..POSTGRES import dbname, user, password, host, port

def generate_poland_bboxes(minx=120_000, miny=100_000, maxx=820_000, maxy=900_000, step=100_000):
    bboxes = []
    x = minx
    while x < maxx:
        y = miny
        while y < maxy:
            bbox = (
                x,
                y,
                min(x + step, maxx),
                min(y + step, maxy)
            )
            bboxes.append(bbox)
            y += step
        x += step
    return bboxes

def fetch_bbox_parallel(fetcher, layer, bbox):
    """Helper function for parallel bbox fetching"""
    try:
        gdf = fetcher.fetch_layer_by_bbox(layer, bbox=bbox)
        if not gdf.empty:
            gdf = to_wgs84(gdf)
            return gdf
    except Exception as e:
        print(f"Error fetching bbox {bbox}: {e}")
    return None



wfs_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ZDJ/WFS/Skorowidze_Srodki_Rzutow_Zdjec"
db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
table_name = "zdjecia_lotnicze_poland5"

fetcher = WFSFetcher(wfs_url, request_delay=0.5, retry_delay=1, timeout=500)
saver = PostgresSaver(db_url)

with saver.engine.begin() as conn:
    
    conn.execute(text(f"""
        CREATE TABLE if not exists {table_name} (
            id BIGINT PRIMARY KEY,
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
                WHERE pt.relname = '{table_name}' 
                AND pc.conname = '{table_name}_uid_unique'
                AND pc.contype = 'u'
            ) THEN
                ALTER TABLE {table_name} ADD CONSTRAINT {table_name}_uid_unique UNIQUE(uid);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_uid_idx'
            ) THEN
                CREATE INDEX {table_name}_uid_idx ON {table_name} (uid);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_geometry_idx'
            ) THEN
                CREATE INDEX {table_name}_geometry_idx ON {table_name} USING GIST (geometry);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_rok_wykonania_idx'
            ) THEN
                CREATE INDEX {table_name}_rok_wykonania_idx ON {table_name} (rok_wykonania);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_charakterystyka_idx'
            ) THEN
                CREATE INDEX {table_name}_charakterystyka_idx ON {table_name} (charakterystyka_przestrzenna);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_kolor_idx'
            ) THEN
                CREATE INDEX {table_name}_kolor_idx ON {table_name} (kolor);
            END IF;
        END$$;
    """))

    conn.execute(text(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}' AND indexname = '{table_name}_zrodlo_danych_idx'
            ) THEN
                CREATE INDEX {table_name}_zrodlo_danych_idx ON {table_name} (zrodlo_danych);
            END IF;
        END$$;
    """))
    
layers = fetcher.get_layers()
bboxes = generate_poland_bboxes(step=50_000)

for i, layer in enumerate(layers):
    print(f"Processing layer {i+1}/{len(layers)}: {layer}")
    start_time = time.time()
    
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
        
        del layer_gdfs
        
        exclude_from_hash = ['uid', 'id', 'gml_id', 'numer_zdjecia']
        
        print(f"Computing hashes for {len(full_gdf)} records...")
        full_gdf['uid'] = hash_attributes_vectorized(full_gdf, exclude_columns=exclude_from_hash)
        full_gdf = deduplicate_gdf(full_gdf, hash_column='uid')
        
        print(f"After deduplication: {len(full_gdf)} unique records")

        print(f"Saving {len(full_gdf)} records to database...")
        
        chunk_size = 10000
        if len(full_gdf) > chunk_size:
            print(f"Processing in chunks of {chunk_size} records...")
            for i in range(0, len(full_gdf), chunk_size):
                chunk = full_gdf.iloc[i:i+chunk_size]
                print(f"Processing chunk {i//chunk_size + 1}/{(len(full_gdf)-1)//chunk_size + 1}")
                saver.append_unique_chunk_sql(chunk, table_name=table_name)
        else:
            saver.append_unique_chunk_sql(full_gdf, table_name=table_name)
        
        elapsed = time.time() - start_time
        print(f"Layer {layer} completed in {elapsed:.2f} seconds")
    else:
        print(f"No data found for layer {layer}")


