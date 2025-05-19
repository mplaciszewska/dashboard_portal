import geopandas as gpd
from sqlalchemy import create_engine
import os
import pandas as pd

folder_path = "data"
geojson_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith('.geojson')]

total_objects = 0

gdfs = []
for file in geojson_files:
    temp_gdf = gpd.read_file(file)
    print(f"Plik: {file}, crs: {temp_gdf.crs}")
    gdfs.append(temp_gdf)

gdf = pd.concat(gdfs, ignore_index=True)
print(len(gdf))

engine = create_engine("<>")

# zapis danych do tabeli
gdf.to_postgis("zdjecia_lotnicze", engine, if_exists="replace", index=False)

print("Dane zostały zapisane do bazy!")
