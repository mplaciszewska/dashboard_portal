// API and fetch config
export const API_BASE_URL = 'http://localhost:8000';
export const STATS_JSON_URL = `${API_BASE_URL}/tiling/tiles/stats.json`;
export const TILES_URL = `${API_BASE_URL}/tiling/tiles/{z}/{x}/{y}.pbf`;
export const METADATA_URL = `${API_BASE_URL}/api/metadane`;
export const FETCH_LIMIT = 100_000;
export const FILTERING_THRESHOLD = 50_000;

// default Values
export const DEFAULT_YEAR_RANGE = [1950, 2025];

// map config
export const MAP_CONFIG = {
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [19, 52],
  zoom: 5,
  pitch: 0,
  antialias: true,
  dragRotate: false,
  pitchWithRotate: false,
  maxPitch: 0,
};

// MVT config
export const MVT_CONFIG = {
  minzoom: 2,
  maxzoom: 12,
  scheme: 'xyz',
  circleRadius: 3.0,
  circleOpacity: 0.8,
};

// deck.gl points layer
export const SCATTERPLOT_CONFIG = {
  radiusUnits: 'pixels',
  baseRadius: 1.5,
  radiusMinPixels: 1.5,
  radiusMaxPixels: 4,
  opacity: 0.9,
  pickable: true,
  pickMultiple: true,
  pickingRadius: 3,
  highlightColor: [128, 0, 32, 255],
  zoomThreshold: 7,
  zoomPower: 1.2,
  zoomScale: 0.7,
};

// deck.gl region layer
export const REGION_LAYER_CONFIG = {
  fillColor: [128, 0, 32, 10],
  lineWidth: 6,
  lineColor: [128, 0, 32, 255],
  lineWidthMinPixels: 2,
};

// map bounds
export const FIT_BOUNDS_OPTIONS = {
  padding: 40,
  duration: 800,
};