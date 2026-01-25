
import geopandas as gpd
import pandas as pd
import hashlib
from shapely.geometry import Point


def to_wgs84(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
    gdf.crs = "EPSG:4326"
    return gdf


def hash_attributes(row: pd.Series, exclude_columns: list[str] | None = None) -> str:
    if exclude_columns is None:
        exclude_columns = ['uid', 'id', 'gml_id']
    exclude_columns = set(exclude_columns)
    
    row = row.copy()
    
    if 'numer_zdjecia' in row.index and 'numer_zdjecia' not in exclude_columns:
        if pd.notna(row['numer_zdjecia']):
            row['numer_zdjecia'] = str(row['numer_zdjecia']).strip()
    
    columns = sorted([c for c in row.index if c not in exclude_columns])
    
    values = []
    for c in columns:
        v = row[c]
        if pd.isna(v):
            values.append('NULL')
        elif c == 'geometry':
            if hasattr(v, 'wkt'):
                geom = v
                if isinstance(geom, Point):
                    rounded = Point(round(geom.x, 5), round(geom.y, 5))
                    values.append(rounded.wkt)
                else:
                    values.append(v.wkt)
            else:
                values.append(str(v))
        elif isinstance(v, float):
            values.append(f"{v:.10f}")
        else:
            values.append(str(v).strip())
    
    hash_input = "|".join(values).encode("utf-8")
    return hashlib.sha256(hash_input).hexdigest()

def deduplicate_gdf(gdf: gpd.GeoDataFrame, hash_column: str = 'uid') -> gpd.GeoDataFrame:
    gdf = gdf.copy()
    gdf = gdf.drop_duplicates(subset=hash_column)
    return gdf


def hash_attributes_vectorized(gdf: gpd.GeoDataFrame, exclude_columns: list[str] | None = None) -> pd.Series:
    """Vectorized version of hash computation using rounded WKT for geometry"""
    if exclude_columns is None:
        exclude_columns = ['uid', 'id', 'gml_id']
    exclude_columns = set(exclude_columns)
    
    df = gdf.copy()
    
    if 'numer_zdjecia' in df.columns and 'numer_zdjecia' not in exclude_columns:
        df['numer_zdjecia'] = df['numer_zdjecia'].astype(str).str.strip()
    
    columns = sorted([c for c in df.columns if c not in exclude_columns])
    
    hash_data = []
    for col in columns:
        if col == 'geometry':
            hash_data.append(df[col].apply(lambda geom: geom.wkt if hasattr(geom, 'wkt') else str(geom)))
        elif col == 'rok_wykonania':
            hash_data.append(df[col].apply(lambda x: 'NULL' if pd.isna(x) else str(int(x))))
        elif col == 'charakterystyka_przestrzenna':
            def fmt_char(x):
                if pd.isna(x):
                    return 'NULL'
                x = float(x)
                if x == int(x):
                    return str(int(x))
                return f"{x:.2f}"
            hash_data.append(df[col].apply(fmt_char))
        elif pd.api.types.is_numeric_dtype(df[col]):
            def fmt_num(x):
                if pd.isna(x):
                    return 'NULL'
                x = float(x)
                if x == int(x):
                    return str(int(x))
                return f"{x:.2f}"
            hash_data.append(df[col].apply(fmt_num))
        else:
            hash_data.append(df[col].fillna('NULL').astype(str).str.strip())
    
    combined = pd.DataFrame(hash_data).T
    combined.columns = columns
    hash_strings = combined.apply(lambda row: b"|".join(
        r if isinstance(r, bytes) else str(r).encode("utf-8") for r in row
    ), axis=1)
    
    return hash_strings.apply(lambda x: hashlib.sha256(x).hexdigest())
