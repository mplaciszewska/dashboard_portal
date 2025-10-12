import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDrawPolygon } from './hooks/useDrawPolygon';
import './MapComponent.css';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { GeoJsonLayer } from '@deck.gl/layers';
import { rgba,colors } from "./theme/colors";

export function getColorForYear(year, yearGroups) {
  const group = yearGroups.find(({ range }) => year >= range[0] && year <= range[1]);
  return group ? group.color : colors.primary;
}

function MapComponent({ filteredFeatures, yearRange, setYearRange, minYear,
  maxYear, onPolygonChange, regionGeometry, isTileMode, setIsTileMode, yearGroups }) {

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const popupRef = useRef(null);
  const drawnPolygon = useDrawPolygon(mapRef.current, regionGeometry);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [popup, setPopup] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [mapBorderRadius, setMapBorderRadius] = useState('8px 8px 0 0');


  const handleYearChange = (event, newValue) => {
    setYearRange(newValue);
  };

  const colorExpression = React.useMemo(() => {
    if (!yearGroups || !yearGroups.length) return colors.primary;

    return [
      "case",
      ...yearGroups.flatMap(g => ([
        ["all",
          [">=", ["get", "rok_wykonania"], g.range[0]],
          ["<=", ["get", "rok_wykonania"], g.range[1]]
        ],
        rgba(g.color)
      ])),
      colors.primary
    ];
  }, [yearGroups]);

  useEffect(() => {
    if (onPolygonChange) {
      if (drawnPolygon) {
        setIsTileMode(false);
        onPolygonChange(drawnPolygon);
        setMapBorderRadius('8px 8px 0 0');
      } else if (regionGeometry) {
        let geometry = regionGeometry.type === "FeatureCollection"
          ? regionGeometry.features[0].geometry
          : regionGeometry.type === "Feature"
            ? regionGeometry.geometry
            : regionGeometry;
        setIsTileMode(false);
        onPolygonChange(geometry);
        setMapBorderRadius('8px 8px 0 0');
      } else {
        onPolygonChange(null);
        setIsTileMode(true);
        setMapBorderRadius('8px');
      }
    }
  }, [drawnPolygon, regionGeometry, onPolygonChange, setIsTileMode]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [19, 52],
      zoom: 5,
      pitch: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      const deckOverlay = new MapboxOverlay({ interleaved: true, layers: [] });
      overlayRef.current = deckOverlay;
      map.addControl(deckOverlay);
    });

    map.on('zoom', () => setZoomLevel(map.getZoom()));

    return () => map.remove();
  }, []);


  // MVTLayers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const setupMVTLayers = () => {
      if (!map.getSource('tiles-source')) {
        map.addSource('tiles-source', {
          type: 'vector',
          tiles: ['http://127.0.0.1:8000/tiling/tiles/{z}/{x}/{y}.pbf'],
          minzoom: 2,
          maxzoom: 12,
          scheme: 'xyz',
        });

        map.addLayer({
          id: 'tiles-layer',
          type: 'circle',
          source: 'tiles-source',
          'source-layer': 'layer',
          paint: {
            'circle-radius': 3.0,
            'circle-opacity': 0.6,
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

  // Deck.GL ScatterplotLayer + GeoJsonLayer
  useEffect(() => {
    if (!overlayRef.current) return;

    const layers = [];

    if (!isTileMode) {
      layers.push(new ScatterplotLayer({
        id: 'scatterplot-layer',
        data: filteredFeatures,
        getPosition: d => d.geometry.coordinates,
        radiusUnits: 'pixels',
        getRadius: () => 1,
        radiusScale: 1 + Math.max(0, Math.pow((zoomLevel - 7), 1.2) * 0.7),
        radiusMinPixels: 1,
        radiusMaxPixels: 3,
        getFillColor: d => getColorForYear(d.properties.rok_wykonania, yearGroups),
        pickable: true,
        onClick: ({ object, x, y }) => setPopup({
          x, y,
          url: object?.properties?.url_do_pobrania || null,
          rok_wykonania: object?.properties?.rok_wykonania || null,
          rozdzielczosc: object?.properties?.charakterystyka_przestrzenna || null,
          kolor: object?.properties?.kolor || null,
          typ_zdjecia: object?.properties?.zrodlo_danych || null,
          nr_zgloszenia: object?.properties?.numer_zgloszenia || null,
        }),
      }));
    }

    if (regionGeometry) {
      layers.push(new GeoJsonLayer({
        id: 'region-layer',
        data: regionGeometry,
        stroked: true,
        filled: true,
        getFillColor: [128, 0, 32, 10],
        getLineWidth: 6,
        getLineColor: [128, 0, 32, 255],
        lineWidthMinPixels: 2,
        lineWidthScale: 1,
      }));
    }

    overlayRef.current.setProps({ layers });
    overlayRef.current.setProps({
      getCursor: ({ isHovering, isDragging }) =>
        isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab',
      layers,
    });

  }, [regionGeometry, filteredFeatures, isTileMode, zoomLevel, yearGroups]);

  // Popup logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) setPopup(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Zoom to region
  useEffect(() => {
    if (!mapRef.current || !regionGeometry) return;
    try {
      const coordinates = regionGeometry.features[0].geometry.coordinates;
      let bounds = new maplibregl.LngLatBounds();
      const coordSets = regionGeometry.features[0].geometry.type === 'Polygon' ? [coordinates] : coordinates;
      coordSets.forEach(polygon => polygon[0].forEach(coord => bounds.extend(coord)));
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 800 });
    } catch (e) {
      console.error('Błąd przy zoomowaniu do regionu:', e);
    }
  }, [regionGeometry]);


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', gap:"0px" }}>
        {popup && (
          <div
            className="popup-container"
            ref={popupRef}
            style={{
              left: popup.x,
              top: popup.y,
            }}
          >
          <table className='popup-table'>
            <tbody>
              <tr>
                <th className='popup-label'>Rok wykonania:</th>
                <td className='popup-value'>{popup.rok_wykonania || 'Brak danych'}</td>
              </tr>
              <tr>
                <th className='popup-label'>Charakterystyka  <br/>przestrzenna:</th>
                <td className='popup-value'>{popup.rozdzielczosc || 'Brak danych'}</td>
              </tr>
              <tr>
                <th className='popup-label'>Kolor:</th>
                <td className='popup-value'>{popup.kolor || 'Brak danych'}</td>
              </tr>
              <tr>
                <th className='popup-label'>Typ zdjęcia:</th>
                <td className='popup-value'>{popup.typ_zdjecia || 'Brak danych'}</td>
              </tr>
              <tr>
                <th className='popup-label'>Nr zgłoszenia:</th>
                <td className='popup-value'>{popup.nr_zgloszenia || 'Brak danych'}</td>
              </tr>
            </tbody>
          </table>
            {popup.url ? (
              <div className="popup-content">
                <img src={popup.url} className='popup-image' alt="Podgląd zdjęcia"/>
                <Button
                  variant="outlined"
                  className='popup-button'
                  startIcon={<img src="/images/download.png" alt="download" style={{ width: 18, height: 18 }} />}
                  component="a"
                  href={popup.url}
                  download
                >
                  Pobierz zdjęcie
                </Button>
              </div>
            ) : (
              <p className="popup-text">Brak zdjęcia do podglądu</p>
            )}
          </div>
        )}

    <div className="map-container" ref={mapContainer} style={{ width: '100%', flex: "90%", borderRadius: mapBorderRadius, boxShadow: ' 0 0 5px rgba(76, 76, 76, 0.35)' }} />

      <button className="legend-button" onClick={() => setShowLegend(true)}>
        L
      </button>

      {/* Legenda */}
      {showLegend && (
        <div className="legend-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowLegend(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              ×
            </button>
          </div>

          {yearGroups.map((group, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: `rgb(${group.color[0]},${group.color[1]},${group.color[2]})`,
                  marginRight: '6px',
                  border: 'none',
                  borderRadius: '50%'
                }}
              />
              <span>
                {group.label}
              </span>
            </div>
          ))}
        </div>
      )}
      { !isTileMode && (
        <Box className="custom-slider-container">
          <Slider
            className="custom-slider"
            value={yearRange}
            min={minYear}
            max={maxYear}
            marks
            step={1}
            onChange={handleYearChange}
            valueLabelDisplay="on"
          />
        </Box>
      )}
    </div>
  );
}

export default MapComponent;
