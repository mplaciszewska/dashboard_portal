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
import { rgba, colorPalette, colors } from "./theme/colors";

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
  const [hoverInfo, setHoverInfo] = useState(null);
  const [popup, setPopup] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

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
      } else if (regionGeometry) {
        let geometry = regionGeometry.type === "FeatureCollection"
          ? regionGeometry.features[0].geometry
          : regionGeometry.type === "Feature"
            ? regionGeometry.geometry
            : regionGeometry;
        setIsTileMode(false);
        onPolygonChange(geometry);
      } else {
        onPolygonChange(null);
        setIsTileMode(true);
      }
    }
  }, [drawnPolygon, regionGeometry, onPolygonChange]);

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
          tiles: ['http://127.0.0.1:8000/tiling/tiles12/{z}/{x}/{y}.pbf'],
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
            'circle-radius': 2.5,
            'circle-opacity': 0.5,
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

  }, [isTileMode, yearGroups]);

useEffect(() => {
  if (!mapRef.current) return;
  const map = mapRef.current;

  if (map.getLayer('tiles-layer')) {
    map.setPaintProperty('tiles-layer', 'circle-color', colorExpression);
    map.setLayoutProperty('tiles-layer', 'visibility', isTileMode ? 'visible' : 'none');
  }
}, [yearGroups, isTileMode]);



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
        onHover: ({ isHovering }) => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = isHovering ? 'pointer' : '';
          }
        }
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
      {hoverInfo && (
        <div className='hover-info' style={{left: hoverInfo.x, top: hoverInfo.y}}>{hoverInfo.count} zdjęć</div>
      )}
        {popup && (
          <div
            ref={popupRef}
            style={{
              position: 'absolute',
              left: popup.x,
              top: popup.y,
              background: 'white',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              zIndex: 1000
            }}
          >
          <table className='popup-table'>
            <tbody>
              <tr>
                <td className='popup-label'>Rok wykonania:</td>
                <td className='popup-value'>{popup.rok_wykonania || 'Brak danych'}</td>
              </tr>
              <tr>
                <td className='popup-label'>Charakterystyka  <br/>przestrzenna:</td>
                <td className='popup-value'>{popup.rozdzielczosc || 'Brak danych'}</td>
              </tr>
              <tr>
                <td className='popup-label'>Kolor:</td>
                <td className='popup-value'>{popup.kolor || 'Brak danych'}</td>
              </tr>
              <tr>
                <td className='popup-label'>Typ zdjęcia:</td>
                <td className='popup-value'>{popup.typ_zdjecia || 'Brak danych'}</td>
              </tr>
              <tr>
                <td className='popup-label'>Nr zgłoszenia:</td>
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

      <div ref={mapContainer} style={{ width: '100%', flex: "90%", borderRadius: '8px 8px 0 0', boxShadow: '0 0 5px rgba(0,0,0,0.2)' }} />

       {/* Przycisk otwierający legendę */}
    <button
      onClick={() => setShowLegend(true)}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '6px 10px',
        borderRadius: '4px',
        backgroundColor: '#fff',
        border: '1px solid #999',
        cursor: 'pointer',
        zIndex: 1001
      }}
    >
      Pokaż legendę
    </button>

    {/* Legenda */}
    {showLegend && (
      <div
        style={{
          position: 'absolute',
          bottom: '60px', // wyżej niż przycisk
          right: '20px',
          marginBottom: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 0 5px rgba(0,0,0,0.3)',
          fontSize: '12px',
          maxWidth: '180px',
          zIndex: 1000,
        }}
      >
        {/* Przycisk zamykania legendy */}
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

        <div>
          <strong>Rok wykonania</strong>
        </div>
        {[...colorPalette].reverse().map((color, index) => {
          const minYear = 1950;
          const maxYear = 2025;
          const totalSteps = colorPalette.length;
          const step = Math.ceil((maxYear - minYear + 1) / totalSteps);

          const isLast = index === totalSteps - 1;
          const rangeEnd = maxYear - index * step;
          const rangeStart = isLast ? minYear : rangeEnd - step + 1;

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: `rgb(${color[0]},${color[1]},${color[2]})`,
                  marginRight: '6px',
                  border: '1px solid #999',
                }}
              />
              <span>
                {rangeStart}-{rangeEnd}
              </span>
            </div>
          );
        })}
      </div>
    )}
    { !isTileMode && (
      <Box className="custom-slider-container">
        <p> Wybierz przedział czasowy</p>
        <Slider
          className="custom-slider"
          value={yearRange}
          min={minYear}
          max={maxYear}
          marks
          step={1}
          onChange={handleYearChange}
          valueLabelDisplay="auto"
        />
      </Box>
    )}
    </div>
  );
}

export default MapComponent;
