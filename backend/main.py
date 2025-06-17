import json
import math
import psycopg2
from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from POSTGRES import dbname, user, password, host, port

#uvicorn main:app --reload

router = APIRouter()
limit = 500000

def sanitize_json(obj):
    if isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None
        return obj
    else:
        return obj

@router.get("/api/zdjecia")
def get_zdjecia(skip: int = 0, limit: int = limit):
    try:
        conn = psycopg2.connect(f"dbname={dbname} user={user} password={password} host={host} port={port}")
        cur = conn.cursor()
        cur.execute("""
            SELECT id, ST_AsGeoJSON(geometry) AS geometry_json, rok_wykonania, kolor, charakterystyka_przestrzenna, zrodlo_danych
            FROM zdjecia_lotnicze
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
            geojson = {
                "type": "Feature",
                "geometry": json.loads(geometry),
                "properties": {
                    "id": id,
                    "rok_wykonania": rok_wykonania,
                    "kolor": kolor,
                    "charakterystyka_przestrzenna": charakterystyka_przestrzenna,
                    "zrodlo_danych": zrodlo_danych
                }
            }
            result.append(geojson)

        return JSONResponse(content={"type": "FeatureCollection", "features": result})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

class PolygonModel(BaseModel):
    polygon: dict
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=limit, ge=1)


@router.post("/api/zdjecia/filter")
async def filter_zdjecia(data: PolygonModel):
    try:
        polygon_geojson = data.polygon
        if isinstance(polygon_geojson, dict):
            polygon_geojson = json.dumps(polygon_geojson)

        conn = psycopg2.connect(f"dbname={dbname} user={user} password={password} host={host} port={port}")
        cur = conn.cursor()
        cur.execute("""
            SELECT id, ST_AsGeoJSON(geometry) AS geometry_json, rok_wykonania, kolor, charakterystyka_przestrzenna, zrodlo_danych
            FROM zdjecia_lotnicze
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
            geojson = {
                "type": "Feature",
                "geometry": json.loads(geometry),
                "properties": {
                    "id": id,
                    "rok_wykonania": rok_wykonania,
                    "kolor": kolor,
                    "charakterystyka_przestrzenna": charakterystyka_przestrzenna,
                    "zrodlo_danych": zrodlo_danych
                }
            }
            result.append(geojson)

        return JSONResponse(content={"type": "FeatureCollection", "features": result})

    except Exception as e:
        print("Error in /api/zdjecia/filter:", e)

        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)