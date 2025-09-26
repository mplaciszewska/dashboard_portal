import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

router = APIRouter()

TILES_DIR = Path(__file__).parent.parent / "tiling" / "tiles12"
STATS_FILE = TILES_DIR / "stats.json"

@router.get("/tiling/tiles12/stats.json")
async def get_stats():
    if not STATS_FILE.exists():
        return JSONResponse(status_code=404, content={"error": "Plik stats.json nie istnieje"})
    with open(STATS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(content=data)

@router.get("/tiling/tiles12/{z}/{x}/{y}.pbf")
async def get_tile(z: int, x: int, y: int):
    tile_path = TILES_DIR / str(z) / str(x) / f"{y}.pbf"
    if tile_path.exists():
        return FileResponse(tile_path, media_type="application/x-protobuf")
