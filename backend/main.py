from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_pool
from .routers import (
    db_metadata,
    photos,
    regions,
    report,
    tiles
)

# uvicorn main:app --reload
# uvicorn backend.main:app --reload

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_pool()


app.include_router(photos.router)
app.include_router(regions.router)
app.include_router(report.router)
app.include_router(tiles.router)
app.include_router(db_metadata.router)