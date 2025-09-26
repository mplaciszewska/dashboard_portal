from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


limit = 500000

class PolygonModel(BaseModel):
    polygon: dict
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=limit, ge=1)


class FeatureProperties(BaseModel):
    id: int
    rok_wykonania: Optional[int]
    kolor: Optional[str]
    charakterystyka_przestrzenna: Optional[float]
    zrodlo_danych: Optional[str]
    url_do_pobrania: Optional[str]
    numer_zgloszenia: Optional[str]

class Feature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: FeatureProperties
    
    
class RegionProperties(BaseModel):
    level: str  # "wojewodztwo", "powiat", "gmina"
    kod: str
    nazwa: str
    
class Region(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: RegionProperties
