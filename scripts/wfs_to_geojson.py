import requests
import geopandas as gpd
import xml.etree.ElementTree as ET
from io import BytesIO
import time

# URL usługi WFS
wfs_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ZDJ/WFS/Skorowidze_Srodki_Rzutow_Zdjec"

capabilities_url = f"{wfs_url}?service=WFS&version=2.0.0&request=GetCapabilities"
capabilities_response = requests.get(capabilities_url)

if capabilities_response.status_code != 200:
    print("Błąd pobierania GetCapabilities")
    exit()

# Parsowanie XML
root = ET.fromstring(capabilities_response.content)
namespaces = {'wfs': "http://www.opengis.net/wfs/2.0"}
layers = [elem.text for elem in root.findall(".//wfs:FeatureType/wfs:Name", namespaces)]
layers = layers[:]


def download_and_save_to_geojson(layer, url):
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typename": layer,
        "outputFormat": "application/gml+xml; version=3.2",  
        "count": 100000, 
    }

    start_index = 0

    while True:
        params["startIndex"] = start_index

        try:
            response = requests.get(url, params=params, timeout=120)

            if response.status_code != 200:
                print(f"Błąd: {response.status_code} - {response.text}")
                break

            gml_filename = f"{layer}_{start_index}.gml"
            with open(gml_filename, "wb") as file:
                file.write(response.content)
            print(f"Dane zapisane do {gml_filename}")

            gdf = gpd.read_file(gml_filename, driver="GML")


            # gdf = gpd.read_file(BytesIO(response.content))

            if gdf.crs.to_epsg() != 4326:
                print(f"-> Transformuję do EPSG:4326 (WGS84) plik: {gml_filename}")
                gdf = gdf.to_crs(epsg=4326)


            output_geojson = f"test_data/{layer.replace(':', '_')}_{start_index}.geojson"
            gdf.crs = "EPSG:4326"
            gdf.to_file(output_geojson, driver="GeoJSON")
            print(f"Dane zapisane do {output_geojson}")

            if len(gdf) < 100000:
                break

            start_index += 100000
            time.sleep(1)

        except requests.exceptions.RequestException as e:
            print(f"Błąd podczas pobierania danych: {e}")
            break


for layer in layers:
    download_and_save_to_geojson(layer, wfs_url)

