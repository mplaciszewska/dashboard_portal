import requests
import geopandas as gpd
import time
import xml.etree.ElementTree as ET
import tempfile
import os
import re
import fiona


class WFSFetcher:
    def __init__(self, wfs_url: str, max_retries: int = 8, timeout: int = 800, request_delay: int = 5, retry_delay: int = 5):
        self.wfs_url = wfs_url
        self.max_retries = max_retries
        self.timeout = timeout
        self.request_delay = request_delay
        self.retry_delay = retry_delay

    def get_layers(self) -> list[str]:
        capabilities_url = f"{self.wfs_url}?service=WFS&version=2.0.0&request=GetCapabilities"
        response = requests.get(capabilities_url, timeout=self.timeout)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        namespaces = {'wfs': "http://www.opengis.net/wfs/2.0"}
        layers = [elem.text for elem in root.findall(".//wfs:FeatureType/wfs:Name", namespaces)]
        
        if self.request_delay > 0:
            time.sleep(self.request_delay)
            
        return layers
    
    def get_feature_count(self, layer: str) -> int:
        """
        Pobiera łączną liczbę obiektów w warstwie.
        """
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typename": layer,
            "resultType": "hits"
        }
        
        try:
            response = requests.get(self.wfs_url, params=params, timeout=self.timeout)
            response.raise_for_status()
            root = ET.fromstring(response.content)

            number_matched = root.attrib.get('numberMatched')
            if number_matched:
                count = int(number_matched)
                print(f"  Layer '{layer}' has {count:,} features.")
                
                if self.request_delay > 0:
                    time.sleep(self.request_delay)
                
                return count
            
            number_of_features = root.attrib.get('numberOfFeatures')
            if number_of_features:
                count = int(number_of_features)
                print(f"  Layer '{layer}' has {count:,} features.")
                
                if self.request_delay > 0:
                    time.sleep(self.request_delay)
                
                return count
            
            print(f"  Warning: Could not determine feature count for layer '{layer}'")
            return 0
            
        except Exception as e:
            print(f"  Error getting feature count for '{layer}': {e}")
            return 0
    
    def extract_year_range_from_layer(self, layer_name: str) -> tuple[int, int] | None:
        """
        Ekstrakcja zakresu lat z nazwy warstwy WFS.
        Przykład: 'gugik:SkorowidzZdjecLotniczych1951-1955' -> (1951, 1955)
        """
        match = re.search(r'(\d{4})-(\d{4})', layer_name)
        if match:
            return (int(match.group(1)), int(match.group(2)))
        
        match = re.search(r'(\d{4})', layer_name)
        if match:
            year = int(match.group(1))
            return (year, year)
        
        return None

    def fetch_layer_by_bbox(self, layer: str, bbox: tuple[float, float, float, float] | None = None) -> gpd.GeoDataFrame:
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

        for attempt in range(1, self.max_retries + 1):
            tmp_path = None
            try:
                with requests.get(self.wfs_url, params=params, stream=True, timeout=self.timeout) as r:
                    r.raise_for_status()
                    with tempfile.NamedTemporaryFile(suffix=".gml", delete=False) as tmp:
                        tmp_path = tmp.name
                        for chunk in r.iter_content(chunk_size=8192):
                            tmp.write(chunk)

                if os.path.getsize(tmp_path) <= 810:
                    return gpd.GeoDataFrame()

                layers_in_file = fiona.listlayers(tmp_path)
                if not layers_in_file:
                    print("Brak warstw w pliku GML, zwracam pusty GeoDataFrame.")
                    return gpd.GeoDataFrame()

                gdf = gpd.read_file(tmp_path, layer=layers_in_file[0])
                
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
                    except Exception:
                        print(f"Nie udało się usunąć pliku tymczasowego: {tmp_path}")

        print(f"Nie udało się pobrać warstwy '{layer}' po {self.max_retries} próbach dla BBOX={bbox}.")
        return gpd.GeoDataFrame()