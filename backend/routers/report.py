from fastapi import APIRouter
from fastapi.responses import Response

from ..models import (
    Feature, 
    FeatureProperties
)
from ..report.generate_report import generate_report_pdf
from ..report.export_csv import export_features_csv
from ..report.export_geojson import export_features_geojson


router = APIRouter()


@router.post("/api/report/pdf")
async def generate_report(data: dict):
    features_data = data.get("features", [])
    features = []
    
    for f in features_data:
        properties = f.get("properties", {})
        feature = Feature(
            geometry=f.get("geometry"),
            properties=FeatureProperties(
                id=properties.get("id"),
                rok_wykonania=properties.get("rok_wykonania"),
                kolor=properties.get("kolor"),
                charakterystyka_przestrzenna=properties.get("charakterystyka_przestrzenna") if properties.get("charakterystyka_przestrzenna") is not None else None,
                zrodlo_danych=properties.get("zrodlo_danych"),
                url_do_pobrania=properties.get("url_do_pobrania"),
                numer_zgloszenia=properties.get("numer_zgloszenia"),
                dt_pzgik=properties.get("dt_pzgik"),
                data_nalotu=properties.get("data_nalotu")
            )
        )
        features.append(feature)
    
    data["features"] = features
    pdf_bytes = generate_report_pdf(data)
    return Response(content=pdf_bytes, media_type="application/pdf")


@router.post("/api/report/csv")
async def generate_report_csv(data: dict):
    features_data = data.get("features", [])
    features = []
    
    for f in features_data:
        properties = f.get("properties", {})
        feature = Feature(
            geometry=f.get("geometry"),
            properties=FeatureProperties(
                id=properties.get("id"),
                rok_wykonania=properties.get("rok_wykonania"),
                kolor=properties.get("kolor"),
                charakterystyka_przestrzenna=properties.get("charakterystyka_przestrzenna") if properties.get("charakterystyka_przestrzenna") is not None else None,
                zrodlo_danych=properties.get("zrodlo_danych"),
                url_do_pobrania=properties.get("url_do_pobrania"),
                numer_zgloszenia=properties.get("numer_zgloszenia"),
                dt_pzgik=properties.get("dt_pzgik"),
                data_nalotu=properties.get("data_nalotu")
            )
        )
        features.append(feature)
    
    data["features"] = features
    csv_bytes = export_features_csv(data)
    return Response(content=csv_bytes, media_type="text/csv")


@router.post("/api/report/geojson")
async def generate_report_geojson(data: dict):
    features_data = data.get("features", [])
    features = []
    
    for f in features_data:
        properties = f.get("properties", {})
        feature = Feature(
            geometry=f.get("geometry"),
            properties=FeatureProperties(
                id=properties.get("id"),
                rok_wykonania=properties.get("rok_wykonania"),
                kolor=properties.get("kolor"),
                charakterystyka_przestrzenna=properties.get("charakterystyka_przestrzenna") if properties.get("charakterystyka_przestrzenna") is not None else None,
                zrodlo_danych=properties.get("zrodlo_danych"),
                url_do_pobrania=properties.get("url_do_pobrania"),
                numer_zgloszenia=properties.get("numer_zgloszenia"),
                dt_pzgik=properties.get("dt_pzgik"),
                data_nalotu=properties.get("data_nalotu")
            )
        )
        features.append(feature)
    
    data["features"] = features
    geojson_bytes = export_features_geojson(data)
    return Response(content=geojson_bytes, media_type="application/geo+json")