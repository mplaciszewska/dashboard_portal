"""
Cron job script to update the database and regenerate tiles if needed.
This script calls the database update function and conditionally runs tile generation.
"""
import sys
import os
from dotenv import load_dotenv
from backend.data.fetch_and_save import main as fetch_and_save_data
from backend.tiling.generate_tiles import MVTGenerator

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


def generate_tiles():
    """Generate vector tiles for the entire dataset"""
    print("\nStarting tile generation...")
    
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
    
    tile_count = 0
    for z, x, y, tile_bytes in tiles:
        folder = f"{tiles_output_dir}/{z}/{x}"
        os.makedirs(folder, exist_ok=True)
        filename = f"{folder}/{y}.pbf"
        with open(filename, "wb") as f:
            f.write(tile_bytes)
        tile_count += 1
        if tile_count % 100 == 0:
            print(f"Generated {tile_count} tiles...")
    
    generator.save_stats(f"{tiles_output_dir}/stats.json")
    print(f"Tile generation completed. Total tiles: {tile_count}")

if __name__ == "__main__":
    print("Starting database update...")
    try:
        new_records = fetch_and_save_data()
        print(f"Database update completed successfully. New records: {new_records}")
        
        if new_records > 0:
            print(f"Detected {new_records} new records. Regenerating tiles...")
            generate_tiles()
        else:
            print("No new records detected. Skipping tile generation.")
            
    except Exception as e:
        print(f"Error in cron job: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
