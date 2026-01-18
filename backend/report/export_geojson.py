import json
from ..models import Feature

def export_features_geojson(data: dict) -> bytes:
    features: list[Feature] = data.get("features", [])

    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for feature in features:
        props = feature.properties
        geom = feature.geometry
        
        geojson_feature = {
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": props.id,
                "rok_wykonania": props.rok_wykonania,
                "kolor": props.kolor,
                "charakterystyka_przestrzenna": props.charakterystyka_przestrzenna,
                "zrodlo_danych": props.zrodlo_danych,
                "url_do_pobrania": props.url_do_pobrania,
                "numer_zgloszenia": props.numer_zgloszenia,
                "dt_pzgik": props.dt_pzgik,
                "data_nalotu": props.data_nalotu
            }
        }
        geojson["features"].append(geojson_feature)

    return json.dumps(geojson, ensure_ascii=False, indent=2).encode('utf-8')
