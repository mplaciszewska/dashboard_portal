import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDrawPolygon } from './hooks/useDrawPolygon';
import { ScreenGridLayer } from '@deck.gl/aggregation-layers';
import './MapComponent.css';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { GeoJsonLayer } from '@deck.gl/layers';
import turfSimplify from '@turf/simplify';


function MapComponent({ features, filteredFeatures, yearRange, setYearRange,   minYear,
  maxYear, onPolygonChange, regionGeometry }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const popupRef = useRef(null);
  const drawnPolygon = useDrawPolygon(mapRef.current, regionGeometry);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [popup, setPopup] = useState(null);

  const handleYearChange = (event, newValue) => {
    setYearRange(newValue);
  };

  useEffect(() => {
    if (onPolygonChange) {
      if (drawnPolygon) {
        onPolygonChange(drawnPolygon);
      } else {
        if (regionGeometry) {
          let geometry = regionGeometry;
          
          if (regionGeometry.type === "Feature") {
            geometry = regionGeometry.geometry;
          } else if (regionGeometry.type === "FeatureCollection" && regionGeometry.features.length) {
            geometry = regionGeometry.features[0].geometry;
          }
          onPolygonChange(geometry);
        } else {
          onPolygonChange(null);
        }
      }
    }
  }, [drawnPolygon, regionGeometry, onPolygonChange]);

  const colorPalette = [
    [35, 104, 123, 130],
    [40, 135, 161, 130],
    [121, 167, 172, 130],
    [181, 200, 184, 130],
    [237, 234, 194, 130],
    [214, 189, 141, 130],
    [189, 146, 90, 130],
    [161, 105, 40, 130],
  ];

  function getColorForYear(year) {
    const minYear = 1950;
    const maxYear = 2025;
    const range = maxYear - minYear + 1;
  
    if (year < minYear || year > maxYear || isNaN(year)) {
      return [200, 200, 200, 180];
    }

    const normalized = (year - minYear) / range;
    let index = Math.floor(normalized * colorPalette.length);
  
    if (index >= colorPalette.length) index = colorPalette.length - 1;

    const reversedIndex = colorPalette.length - 1 - index;
  
    return [...colorPalette[reversedIndex], 180];
  }

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
      const deckOverlay = new MapboxOverlay({
        interleaved: true,
        layers: [],
        
      });
      overlayRef.current = deckOverlay;
      map.addControl(deckOverlay);
    });

    map.on('zoom', () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;

    overlayRef.current.setProps({ layers: [] });

    let layer;

    if (zoomLevel < 7.5) {
      layer = new ScreenGridLayer({
        id: 'screen-grid-layer',
        data: filteredFeatures,
        getPosition: d => d.geometry.coordinates,
        cellSizePixels: 25,
        getWeight: () => 1,
        colorRange: [
          [255, 255, 204],
          [199, 233, 180],
          [127, 205, 187],
          [65, 182, 196],
          [29, 145, 192],
          [34, 94, 168],
          [37, 52, 148],
          [8, 29, 88],
          [0, 0, 55],
        ],
        opacity: 0.3,
        pickable: true,
        aggregation: 'SUM',
        cellMarginPixels: 3,
        onHover: info => {
          if (info && info.object) {
            setHoverInfo({
              x: info.x,
              y: info.y - 20,
              count: info.object.count,
            });
          } else {
            setHoverInfo(null);
          }
        }
      });
    } else {
      setHoverInfo(null);
      layer = new ScatterplotLayer({
        id: 'scatterplot-layer',
        data: filteredFeatures,
        getPosition: d => d.geometry.coordinates,
        radiusUnits: 'pixels',
        getRadius: () => 1,
        radiusScale: 1 + Math.max(0, Math.pow((zoomLevel - 7), 1.2) * 0.7),
        radiusMinPixels: 1,
        radiusMaxPixels: 4,
        getFillColor: d => getColorForYear(d.properties?.rok_wykonania),
        pickable: true,
        onClick: ({object, x, y}) => {
          setPopup({
            x,
            y,
            url: object?.properties?.url_do_pobrania || null,
            rok_wykonania: object?.properties?.rok_wykonania || null,
            rozdzielczosc: object?.properties?.charakterystyka_przestrzenna || null,
            kolor: object?.properties?.kolor || null,
            typ_zdjecia: object?.properties?.zrodlo_danych || null,
            nr_zgloszenia: object?.properties?.numer_zgloszenia || null,
          });
        }
      });
    }

    const layers = [layer];

    if (regionGeometry) {
      layers.push(
        new GeoJsonLayer({
          id: "region-layer",
          data: regionGeometry,
          stroked: true,
          filled: true,
          getFillColor: [128, 0, 32, 10],
          getLineWidth: 6,
          getLineColor: [128, 0, 32, 255],
          lineWidthMinPixels: 2,
          lineWidthScale: 1,
        })
      );
    }
    overlayRef.current.setProps({ layers });

    return () => {
      overlayRef.current.setProps({ layers: [] });
    };
  }, [features, yearRange, zoomLevel, regionGeometry, filteredFeatures]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !regionGeometry) return;

    try {
      const coordinates = regionGeometry.features[0].geometry.coordinates;

      let bounds = new maplibregl.LngLatBounds();
      const coordSets = regionGeometry.features[0].geometry.type === 'Polygon'
        ? [coordinates]
        : coordinates;

      coordSets.forEach(polygon => {
        polygon[0].forEach(coord => {
          bounds.extend(coord);
        });
      });

      mapRef.current.fitBounds(bounds, {
        padding: 40,
        duration: 800
      });
    } catch (e) {
      console.error("Błąd przy zoomowaniu do regionu:", e);
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

      {/* Legenda */}
      {/* <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          marginBottom: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 0 5px rgba(0,0,0,0.3)',
          fontSize: '12px',
          maxWidth: '180px',
        }}
      >
        <div>
          <strong>Rok wykonania</strong>
        </div>
        {colorPalette.map((color, index) => {
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
                {rangeStart}–{rangeEnd}
              </span>
            </div>
          );
        })}
      </div> */}
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
    </div>
  );
}

export default MapComponent;
