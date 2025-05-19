import geopandas as gpd
import os

folder = "data"

for file in os.listdir(folder):
    if file.endswith(".geojson"):
        path = os.path.join(folder, file)
        gdf = gpd.read_file(path)
        print(f"{file} — obecny CRS: {gdf.crs}")


        # Transformacja do WGS84
        if gdf.crs.to_epsg() != 4326:
            print(f"-> Transformuję do EPSG:4326 (WGS84) plik: {file}")
            gdf = gdf.to_crs(epsg=4326)
        else:
            print(f"-> Plik {file} już w EPSG:4326")

        # Nadpisz oryginalny plik
        gdf.to_file(path, driver="GeoJSON")
        print(f"-> Zapisano {file} jako EPSG:4326\n")
