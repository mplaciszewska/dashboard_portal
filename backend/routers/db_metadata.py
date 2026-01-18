from fastapi import APIRouter, HTTPException
from datetime import datetime

from ..models import Metadata
from ..db import (
    get_connection,
    release_connection,
    DatabaseTables
)

router = APIRouter()

@router.get("/api/metadane")
def get_metadata() -> Metadata:
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT records_count, to_char(last_update, 'YYYY-MM-DD HH24:MI:SS') AS last_update, convex_hull_area 
            FROM {DatabaseTables.metadata_table}
            ORDER BY last_update DESC
            LIMIT 1
        """)
        
        row = cur.fetchone()
        
        if row is None:
            raise HTTPException(status_code=404, detail="No metadata found")
        
        records_count, last_update, convex_hull_area = row
        
        metadata = Metadata(
            records_count=records_count,
            last_update=last_update.isoformat() if isinstance(last_update, datetime) else last_update,
            convex_hull_area_km2=convex_hull_area
        )

        return metadata
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metadata: {str(e)}")
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            release_connection(conn)
