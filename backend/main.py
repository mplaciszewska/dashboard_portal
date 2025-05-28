import json
import math
import psycopg2
from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

#uvicorn main:app --reload

router = APIRouter()

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
def get_zdjecia(skip: int = 0, limit: int = 500000):
    try:
        conn = psycopg2.connect("dbname=praca_inzynierska_db user=postgres password=325699 host=localhost port=5433")
        cur = conn.cursor()
        cur.execute("""
            SELECT id, ST_AsGeoJSON(geometry) AS geometry_json, numer_zdjecia, rok_wykonania
            FROM zdjecia_lotnicze
            ORDER BY id
            OFFSET %s LIMIT %s
        """, (skip, limit))
        
        rows = cur.fetchall()
        result = []
        for row in rows:
            id = row[0]
            geometry = row[1]
            numer_zdjecia = row[2]
            rok_wykonania = row[3]
            geojson = {
                "type": "Feature",
                "geometry": json.loads(geometry),
                "properties": {
                    "id": id,
                    "numer_zdjecia": numer_zdjecia,
                    "rok_wykonania": rok_wykonania
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)