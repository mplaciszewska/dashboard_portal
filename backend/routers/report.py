from fastapi import APIRouter
from fastapi.responses import Response

from ..models import Feature, FeatureProperties
from ..report.generate_report import generate_report_pdf


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
                charakterystyka_przestrzenna=str(properties.get("charakterystyka_przestrzenna")) if properties.get("charakterystyka_przestrzenna") is not None else None,
                zrodlo_danych=properties.get("zrodlo_danych"),
                url_do_pobrania=properties.get("url_do_pobrania"),
                numer_zgloszenia=properties.get("numer_zgloszenia")
            )
        )
        features.append(feature)
    
    data["features"] = features
    pdf_bytes = generate_report_pdf(data)
    return Response(content=pdf_bytes, media_type="application/pdf")