import requests
import geopandas as gpd
import xml.etree.ElementTree as ET
import os
import time

# Ustawienia
wfs_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ZDJ/WFS/Skorowidze_Srodki_Rzutow_Zdjec"
output_dir = "test100_data"
os.makedirs(output_dir, exist_ok=True)
version = "1.1.0"
max_features = 10000  # bezpieczna paczka

# Sprawdzenie GetCapabilities
capabilities_url = f"{wfs_url}?service=WFS&version={version}&request=GetCapabilities"
capabilities_response = requests.get(capabilities_url)
if capabilities_response.status_code != 200:
    print("❌ Błąd GetCapabilities:", capabilities_response.status_code)
    exit()

root = ET.fromstring(capabilities_response.content)
namespaces = {'wfs': "http://www.opengis.net/wfs"}
layers = [elem.text for elem in root.findall(".//wfs:Name", namespaces)]
print("🔍 Wykryto warstwy:", layers)


def get_feature_count(layer):
    params = {
        "service": "WFS",
        "version": version,
        "request": "GetFeature",
        "typename": layer,
        "resultType": "hits"
    }
    res = requests.get(wfs_url, params=params)
    if res.status_code == 200:
        root = ET.fromstring(res.content)
        return int(root.attrib.get("numberOfFeatures", 0))
    else:
        print(f"⚠️ Błąd resultType=hits dla {layer}: {res.status_code}")
        return 0


def download_features(layer, total):
    print(f"⬇️ Pobieranie {total} obiektów z warstwy: {layer}")
    downloaded = 0
    part = 0

    while downloaded < total:
        params = {
            "service": "WFS",
            "version": version,
            "request": "GetFeature",
            "typename": layer,
            "outputFormat": "application/json",
            "maxFeatures": max_features
        }

        # WFS 1.1.0 nie obsługuje startIndex — trzeba filtrować ręcznie lub używać startPosition (jeśli wspiera)
        if downloaded > 0:
            params["startPosition"] = downloaded + 1  # niektóre serwery to wspierają

        try:
            res = requests.get(wfs_url, params=params, timeout=60)
            if res.status_code != 200:
                print(f"❌ Błąd pobierania paczki {part}: {res.status_code}")
                break

            gdf = gpd.read_file(res.text)

            if gdf.empty:
                print(f"⚠️ Otrzymano pusty zbiór przy part={part}")
                break

            print(f"✅ Paczka {part}: {len(gdf)} obiektów")

            output_file = os.path.join(output_dir, f"{layer.replace(':', '_')}_{part}.geojson")
            gdf.to_file(output_file, driver="GeoJSON")

            downloaded += len(gdf)
            part += 1
            time.sleep(1)  # szanuj serwer

        except Exception as e:
            print(f"❌ Błąd: {e}")
            break


# Główna pętla
for layer in layers:
    total = get_feature_count(layer)
    print(f"📊 Warstwa {layer} zawiera {total} obiektów")
    if total > 0:
        download_features(layer, total)
