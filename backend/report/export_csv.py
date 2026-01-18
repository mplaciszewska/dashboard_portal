import csv
from io import StringIO

from ..models import Feature

def export_features_csv(data: dict) -> bytes:
    features: list[Feature] = data.get("features", [])

    output = StringIO()
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    header = [
        "id",
        "longitude",
        "latitude",
        "rok_wykonania",
        "kolor",
        "charakterystyka_przestrzenna",
        "zrodlo_danych",
        "url_do_pobrania",
        "numer_zgloszenia",
        "dt_pzgik",
        "data_nalotu"
    ]
    writer.writerow(header)

    for feature in features:
        props = feature.properties
        geom = feature.geometry
        row = [
            props.id,
            geom.get("coordinates")[0],
            geom.get("coordinates")[1],
            props.rok_wykonania or "",
            props.kolor or "",
            f"{props.charakterystyka_przestrzenna:.6f}" if props.charakterystyka_przestrzenna is not None else "",
            props.zrodlo_danych or "",
            props.url_do_pobrania or "",
            props.numer_zgloszenia or "",
            props.dt_pzgik or "",
            props.data_nalotu or "",
        ]
        writer.writerow(row)

    bom = '\ufeff'
    return (bom + output.getvalue()).encode('utf-8')
