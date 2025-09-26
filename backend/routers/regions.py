from fastapi.responses import JSONResponse
from fastapi import APIRouter, Query
import json

from ..models import Region, RegionProperties
from ..db import get_connection, release_connection


router = APIRouter()

@router.get("/api/wojewodztwa")
def get_wojewodztwa():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT "JPT_KOD_JE", "JPT_NAZWA_" FROM wojewodztwa ORDER BY "JPT_NAZWA_"
        """)
        wojewodztwa = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        return JSONResponse(content=wojewodztwa)
    finally:
        cur.close()
        release_connection(conn)

@router.get("/api/powiaty")
def get_powiaty(woj_id: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT "JPT_KOD_JE", "JPT_NAZWA_" FROM powiaty 
            WHERE woj_kod = %s ORDER BY "JPT_NAZWA_"
        """, (woj_id,))
        powiaty = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        return JSONResponse(content=powiaty)
    finally:
        cur.close()
        release_connection(conn)


@router.get("/api/gminy")
def get_gminy(powiat_id: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT "JPT_KOD_JE", "JPT_NAZWA_" FROM gminy 
            WHERE pow_kod = %s ORDER BY "JPT_NAZWA_"
        """, (powiat_id,))
        gminy = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        return JSONResponse(content=gminy)
    finally:
        cur.close()
        release_connection(conn)


@router.get("/api/region")
def get_region(level: str = Query(..., regex="^(woj|pow|gmi)$"),
               jpt_kod: str = Query(...)):
    table = {"woj": "wojewodztwa", "pow": "powiaty", "gmi": "gminy"}[level]
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            f'SELECT "JPT_KOD_JE", ST_AsGeoJSON(geometry), "JPT_NAZWA_" '
            f'FROM {table} WHERE "JPT_KOD_JE" = %s', (jpt_kod,)
        )
        row = cur.fetchone()
        if row is None:
            return JSONResponse(status_code=404, content={"error": "Geometria nie znaleziona"})

        kod, geom_json, nazwa = row
        region = Region(
            geometry=json.loads(geom_json),
            properties=RegionProperties(level=level, kod=kod, nazwa=nazwa)
        )
        return {"type": "FeatureCollection", "features": [region]}
    finally:
        cur.close()
        release_connection(conn)