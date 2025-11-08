import requests
import geopandas as gpd
import time
import xml.etree.ElementTree as ET
import tempfile
import os
import tempfile
import requests
import geopandas as gpd
import fiona
import time

class WFSFetcher:
    def __init__(self, wfs_url, max_retries=6, timeout=600, request_delay=2, retry_delay=2):
        self.wfs_url = wfs_url
        self.max_retries = max_retries
        self.timeout = timeout
        self.request_delay = request_delay
        self.retry_delay = retry_delay

    def get_layers(self):
        capabilities_url = f"{self.wfs_url}?service=WFS&version=2.0.0&request=GetCapabilities"
        response = requests.get(capabilities_url, timeout=self.timeout)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        namespaces = {'wfs': "http://www.opengis.net/wfs/2.0"}
        layers = [elem.text for elem in root.findall(".//wfs:FeatureType/wfs:Name", namespaces)]
        
        if self.request_delay > 0:
            time.sleep(self.request_delay)
            
        return layers

    def fetch_layer_by_bbox(self, layer, bbox=None):
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typename": layer,
            "outputFormat": "text/xml; subtype=gml/3.1.1",
        }

        if bbox:
            params["bbox"] = ",".join(map(str, bbox))
            params["srsName"] = "EPSG:2180"
        else:
            params["srsName"] = "EPSG:2180"

        req = requests.Request('GET', self.wfs_url, params=params).prepare()
        print(f"\n>>> Start pobierania warstwy '{layer}' z BBOX={bbox}")
        print(f"Pełny URL do pobrania: {req.url}")

        for attempt in range(1, self.max_retries + 1):
            tmp_path = None
            try:
                print(f"Próba {attempt}...")
                with requests.get(self.wfs_url, params=params, stream=True, timeout=self.timeout) as r:
                    r.raise_for_status()
                    with tempfile.NamedTemporaryFile(suffix=".gml", delete=False) as tmp:
                        tmp_path = tmp.name
                        for chunk in r.iter_content(chunk_size=8192):
                            tmp.write(chunk)

                print(f"Pobrano plik tymczasowy: {tmp_path}, rozmiar: {os.path.getsize(tmp_path)} bajtów")

                if os.path.getsize(tmp_path) <= 810:
                    print("Plik jest pusty, brak danych dla tego BBOX.")
                    return gpd.GeoDataFrame()

                layers_in_file = fiona.listlayers(tmp_path)
                if not layers_in_file:
                    print("Brak warstw w pliku GML, zwracam pusty GeoDataFrame.")
                    return gpd.GeoDataFrame()

                gdf = gpd.read_file(tmp_path, layer=layers_in_file[0])
                print(f"Pobrano {len(gdf)} obiektów z warstwy '{layer}' dla BBOX={bbox}")
                
                if self.request_delay > 0:
                    time.sleep(self.request_delay)
                
                return gdf

            except requests.exceptions.RequestException as e:
                print(f"Błąd pobierania '{layer}', BBOX={bbox}, próba {attempt}: {e}")
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay)
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                        print(f"Usunięto plik tymczasowy: {tmp_path}")
                    except Exception:
                        print(f"Nie udało się usunąć pliku tymczasowego: {tmp_path}")

        print(f"Nie udało się pobrać warstwy '{layer}' po {self.max_retries} próbach dla BBOX={bbox}.")
        return gpd.GeoDataFrame()