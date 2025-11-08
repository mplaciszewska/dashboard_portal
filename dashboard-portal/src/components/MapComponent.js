import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDrawPolygon } from '../hooks/useDrawPolygon';
import './MapComponent.css';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { colors } from "../theme/colors";
import { LegendControl, DrawControls, PopupWindow } from './MapControls';

import { 
  getColorForYear, 
  createColorExpression, 
  calculateRadiusScale,
  createScatterplotClickHandler
} from '../utils/mapHelpers';

import { 
  extractGeometryFromRegion, 
  fitMapToRegion, 
  getMapBorderRadius 
} from '../utils/geometryHelpers';

import { 
  MAP_CONFIG, 
  MVT_CONFIG, 
  SCATTERPLOT_CONFIG, 
  REGION_LAYER_CONFIG,
  TILES_URL
} from '../utils/constants';


function MapComponent({ filteredFeatures, yearRange, setYearRange, minYear,
  maxYear, onPolygonChange, regionGeometry, isTileMode, setIsTileMode, yearGroups, selectedCategory, setSelectedCategory, loading }) {

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const popupRef = useRef(null);
  const [scatterVisible, setScatterVisible] = useState(true);
  const { drawnPolygon, drawPolygon, drawRectangle, deletePolygon } = useDrawPolygon(mapRef.current, regionGeometry, { onDrawingChange: setScatterVisible });
  const [zoomLevel, setZoomLevel] = useState(5);
  const [popup, setPopup] = useState(null);
  const [mapBorderRadius, setMapBorderRadius] = useState('8px 8px 0 0');

  const handleYearChange = (event, newValue) => {
    if (loading) return;
    setYearRange(newValue);
  };

  const colorExpression = React.useMemo(() => {
    return createColorExpression(yearGroups);
  }, [yearGroups]);
  

  useEffect(() => {
    if (onPolygonChange) {
      if (drawnPolygon) {
        setIsTileMode(false);
        onPolygonChange(drawnPolygon);
      } else if (regionGeometry) {
        const geometry = extractGeometryFromRegion(regionGeometry);
        setIsTileMode(false);
        onPolygonChange(geometry);
      } else {
        onPolygonChange(null);
        setIsTileMode(true);
      }
      setMapBorderRadius(getMapBorderRadius(drawnPolygon, regionGeometry));
    }
  }, [drawnPolygon, regionGeometry, onPolygonChange, setIsTileMode]);


  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      ...MAP_CONFIG
    });

    mapRef.current = map;

    map.on('load', () => {
      const deckOverlay = new MapboxOverlay({ interleaved: true, layers: [] });
      overlayRef.current = deckOverlay;
      map.addControl(deckOverlay);
      overlayRef.current.deck = deckOverlay._deck;
    });
    map.on('zoom', () => setZoomLevel(map.getZoom()));

    return () => map.remove();
  }, []);


  // MVT layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const setupMVTLayers = () => {
      if (!map.getSource('tiles-source')) {
        map.addSource('tiles-source', {
          type: 'vector',
          tiles: [TILES_URL],
          minzoom: MVT_CONFIG.minzoom,
          maxzoom: MVT_CONFIG.maxzoom,
          scheme: MVT_CONFIG.scheme,
        });

        map.addLayer({
          id: 'tiles-layer',
          type: 'circle',
          source: 'tiles-source',
          'source-layer': 'layer',
          paint: {
            'circle-radius': MVT_CONFIG.circleRadius,
            'circle-opacity': MVT_CONFIG.circleOpacity,
            'circle-color': colorExpression
          },
          layout: { visibility: isTileMode ? 'visible' : 'none' },
        });
      } else {
        map.setPaintProperty('tiles-layer', 'circle-color', colorExpression);
        map.setLayoutProperty('tiles-layer', 'visibility', isTileMode ? 'visible' : 'none');
      }

      map.on('error', (e) => {
        if (e.sourceId === 'tiles-source' && e.error && e.error.status === 404) {
          console.warn('Kafel nie istnieje, ignoruję.');
          e.preventDefault();
        }
      });
    };

    if (map.isStyleLoaded()) {
      setupMVTLayers();
    } else {
      map.once('load', setupMVTLayers);
    }

  }, [isTileMode, yearGroups, colorExpression]);

  
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer('tiles-layer')) {
      map.setPaintProperty('tiles-layer', 'circle-color', colorExpression);
      map.setLayoutProperty('tiles-layer', 'visibility', isTileMode ? 'visible' : 'none');
    }
  }, [yearGroups, isTileMode, colorExpression]);


  const scatterplotLayer = React.useMemo(() => {
    if (isTileMode) return null;

    return new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: filteredFeatures,
      getPosition: d => d.geometry.coordinates,
      radiusUnits: SCATTERPLOT_CONFIG.radiusUnits,
      getRadius: () => SCATTERPLOT_CONFIG.baseRadius,
      radiusScale: calculateRadiusScale(zoomLevel),
      radiusMinPixels: SCATTERPLOT_CONFIG.radiusMinPixels,
      radiusMaxPixels: SCATTERPLOT_CONFIG.radiusMaxPixels,
      getFillColor: d => getColorForYear(d.properties.rok_wykonania, yearGroups),
      opacity: SCATTERPLOT_CONFIG.opacity,
      pickable: SCATTERPLOT_CONFIG.pickable,
      pickMultiple: SCATTERPLOT_CONFIG.pickMultiple,
      pickingRadius: SCATTERPLOT_CONFIG.pickingRadius,
      onClick: createScatterplotClickHandler(overlayRef, setPopup),
      autoHighlight: true,
      highlightColor: SCATTERPLOT_CONFIG.highlightColor,
      updateTriggers: {
        getFillColor: [selectedCategory, yearGroups],
        getRadius: [zoomLevel],
        getPosition: filteredFeatures,
      },
      dataComparator: (newData, oldData) => newData === oldData,
    });
  }, [filteredFeatures, isTileMode, zoomLevel, yearGroups, selectedCategory, setPopup]);

  useEffect(() => {
    if (!overlayRef.current) return;

    const layers = [];

    if (regionGeometry) {
      layers.push(new GeoJsonLayer({
        id: 'region-layer',
        data: regionGeometry,
        stroked: true,
        filled: true,
        getFillColor: REGION_LAYER_CONFIG.fillColor,
        getLineWidth: REGION_LAYER_CONFIG.lineWidth,
        getLineColor: REGION_LAYER_CONFIG.lineColor,
        lineWidthMinPixels: REGION_LAYER_CONFIG.lineWidthMinPixels,
      }));
    }

    if (scatterVisible && scatterplotLayer) {
      layers.push(scatterplotLayer);
    }

    overlayRef.current.setProps({ 
      layers,
      getCursor: ({ isHovering }) => (isHovering ? 'pointer' : 'grab')
    });
    
  }, [scatterVisible, scatterplotLayer, regionGeometry]);


  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer('tiles-layer')) {
      map.setLayoutProperty('tiles-layer', 'visibility', scatterVisible && isTileMode ? 'visible' : 'none');
    }
  }, [scatterVisible]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) setPopup(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    if (!mapRef.current || !regionGeometry) return;
    fitMapToRegion(mapRef.current, regionGeometry);
  }, [regionGeometry]);


  return (
    <div className="map-wrapper">
    <PopupWindow popup={popup} popupRef={popupRef} />
    <div className="map-container" ref={mapContainer} 
      style={{ 
        width: '100%',
        flex: "90%",
        borderRadius: mapBorderRadius,
        boxShadow: ' 0 0 5px rgba(76, 76, 76, 0.35)' 
      }} />

      <DrawControls
        drawPolygon={drawPolygon}
        drawRectangle={drawRectangle}
        deletePolygon={deletePolygon}
      />
      {selectedCategory && (
        <div className="filter-indicator">
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          Filtr: <strong>{selectedCategory.value}</strong>
        </span>
        <button
          className="button-close"
          onClick={() => !loading && setSelectedCategory(null)}
          aria-label="Usuń filtr"
          disabled={loading}
          style={{
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          <img className="button-close" src="/images/close.png" alt="Zamknij"></img>
        </button>
      </div>
    )}
      <LegendControl yearGroups={yearGroups} />
      { !isTileMode && (
        <Box className="custom-slider-container" sx={{ 
          pointerEvents: loading ? 'none' : 'auto',
          opacity: loading ? 0.5 : 1 
        }}>
          <Slider
            className="custom-slider"
            value={yearRange}
            min={minYear}
            max={maxYear}
            marks
            step={1}
            onChange={handleYearChange}
            valueLabelDisplay="on"
            disabled={loading}
          />
        </Box>
      )}
    </div>
  );
}

export default MapComponent;
