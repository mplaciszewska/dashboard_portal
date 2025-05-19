import json
import os

geojson_files = [
    "data/gugik_SkorowidzZdjecLotniczych1971-1975.geojson",
    "data/gugik_SkorowidzZdjecLotniczych1986-1990.geojson",
    "data/gugik_SkorowidzZdjecLotniczych1991-1995.geojson",
    "data/gugik_SkorowidzZdjecLotniczych1996-2000.geojson",
    "data/gugik_SkorowidzZdjecLotniczych2001-2005.geojson",
    "data/gugik_SkorowidzZdjecLotniczych2006-2010_0.geojson",
    "data/gugik_SkorowidzZdjecLotniczych2011-2015_0.geojson",
    "data/gugik_SkorowidzZdjecLotniczych2016-2020_0.geojson",
]

all_features = []

for file in geojson_files:
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)
        if "features" in data:
            all_features.extend(data["features"])
        else:
            print(f"⚠️  Plik {file} nie zawiera sekcji 'features'.")

combined_geojson = {
    "type": "FeatureCollection",
    "features": all_features
}

output_file = "test_data/combined.geojson"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(combined_geojson, f, ensure_ascii=False, indent=2)

print(f"Połączono {len(geojson_files)} plików do {output_file}")
