from fastapi.responses import JSONResponse
from fastapi import APIRouter
import json

from ..models import Feature, FeatureProperties, PolygonModel
from ..db import get_connection, release_connection

router = APIRouter()

@router.get("/api/zdjecia")
def get_zdjecia(skip: int = 0, limit: int = 500_000):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, ST_AsGeoJSON(geometry) AS geometry_json, rok_wykonania, kolor, charakterystyka_przestrzenna, zrodlo_danych, url_do_pobrania, numer_zgloszenia
            FROM zdjecia_lotnicze_poland4
            ORDER BY id
            OFFSET %s LIMIT %s
        """, (skip, limit))
        
        rows = cur.fetchall()
        result = []

        for row in rows:
            id = row[0]
            geometry = row[1]
            rok_wykonania = row[2]
            kolor = row[3]
            charakterystyka_przestrzenna = row[4]
            zrodlo_danych = row[5]
            url_do_pobrania = row[6] 
            numer_zgloszenia = row[7]
            feature = Feature(
                geometry=json.loads(geometry),
                properties=FeatureProperties(
                    id=id,
                    rok_wykonania=rok_wykonania,
                    kolor=kolor,
                    charakterystyka_przestrzenna=charakterystyka_przestrzenna,
                    zrodlo_danych=zrodlo_danych,
                    url_do_pobrania=url_do_pobrania,
                    numer_zgloszenia=numer_zgloszenia
                )
            )
            result.append(feature)

        return {"type": "FeatureCollection", "features": result}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            release_connection(conn)



@router.post("/api/zdjecia/filter")
async def filter_zdjecia(data: PolygonModel):
    try:
        print("Received polygon:", data.polygon)
        polygon_geojson = data.polygon
        if isinstance(polygon_geojson, dict):
            polygon_geojson = json.dumps(polygon_geojson)

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, ST_AsGeoJSON(geometry) AS geometry_json, rok_wykonania, kolor, charakterystyka_przestrzenna, zrodlo_danych, url_do_pobrania, numer_zgloszenia
            FROM zdjecia_lotnicze_poland4
            WHERE ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))
            ORDER BY id
            OFFSET %s LIMIT %s
        """, (polygon_geojson,data.skip, data.limit))

        rows = cur.fetchall()
        result = []
        for row in rows:
            id = row[0]
            geometry = row[1]
            rok_wykonania = row[2]
            kolor = row[3]  
            charakterystyka_przestrzenna = row[4]
            zrodlo_danych = row[5]
            url_do_pobrania = row[6] 
            numer_zgloszenia = row[7] 
            feature = Feature(
                geometry=json.loads(geometry),
                properties=FeatureProperties(
                    id=id,
                    rok_wykonania=rok_wykonania,
                    kolor=kolor,
                    charakterystyka_przestrzenna=charakterystyka_przestrzenna,
                    zrodlo_danych=zrodlo_danych,
                    url_do_pobrania=url_do_pobrania,
                    numer_zgloszenia=numer_zgloszenia
                )
            )
            result.append(feature)

        return {"type": "FeatureCollection", "features": result}

    except Exception as e:
        print("Error in /api/zdjecia/filter:", e)

        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            release_connection(conn)