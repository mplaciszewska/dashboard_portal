import area from '@turf/area';
import maplibregl from 'maplibre-gl';
import { DEFAULT_POLYGON_AREA_KM2, FIT_BOUNDS_OPTIONS } from './constants';


export function calculatePolygonArea(polygon) {
  if (!polygon) return 0;
  try {
    return area(polygon) / 1_000_000;
  } catch (error) {
    console.error('Error calculating polygon area:', error);
    return 0;
  }
}


export function extractGeometryFromRegion(regionGeometry) {
  if (!regionGeometry) return null;

  if (regionGeometry.type === "FeatureCollection") {
    return regionGeometry.features[0].geometry;
  } else if (regionGeometry.type === "Feature") {
    return regionGeometry.geometry;
  } else {
    return regionGeometry;
  }
}


export function fitMapToRegion(map, regionGeometry, options = FIT_BOUNDS_OPTIONS) {
  if (!map || !regionGeometry) return;

  try {
    const coordinates = regionGeometry.features[0].geometry.coordinates;
    const bounds = new maplibregl.LngLatBounds();
    
    const coordSets = regionGeometry.features[0].geometry.type === 'Polygon' 
      ? [coordinates] 
      : coordinates;
    
    coordSets.forEach(polygon => {
      polygon[0].forEach(coord => bounds.extend(coord));
    });
    
    map.fitBounds(bounds, options);
  } catch (e) {
    console.error('Błąd przy zoomowaniu do regionu:', e);
  }
}


export function getMapBorderRadius(drawnPolygon, regionGeometry) {
  if (drawnPolygon || regionGeometry) {
    return '8px 8px 0 0';
  }
  return '8px';
}
