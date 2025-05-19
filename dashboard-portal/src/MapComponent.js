import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useFetchPointsData } from './hooks/useFetchPointsData';
import 'mapbox-gl/dist/mapbox-gl.css';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { useDrawPolygon } from './hooks/useDrawPolygon';
import { useFilterFeaturesByPolygon } from './hooks/useFilterFeaturesByPolygon';
import './MapComponent.css';


function MapComponent() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const drawRef = useRef(null);

  const features = useFetchPointsData({ limit: 500000 });
  const drawnPolygon = useDrawPolygon(mapRef.current);
  const filteredFeatures = useFilterFeaturesByPolygon(features, drawnPolygon);

  const colorPalette = [
    [35, 104, 123, 100],
    [40, 135, 161, 100],
    [121, 167, 172, 100],
    [181, 200, 184, 100],
    [237, 234, 194, 100],
    [214, 189, 141, 100],
    [189, 146, 90, 100],
    [161, 105, 40, 100],
  ];

  function getColorForYear(year) {
    const minYear = 1950;
    const maxYear = 2025;
    const range = maxYear - minYear + 1;
  
    if (year < minYear || year > maxYear || isNaN(year)) {
      return [200, 200, 200, 180]; // szary jako kolor domyślny dla nieprawidłowych lat
    }
  
    // Obliczamy indeks w zakresie 0..colorPalette.length - 1
    const normalized = (year - minYear) / range; // od 0 do <1
    let index = Math.floor(normalized * colorPalette.length);
  
    // Jeśli year == maxYear, indeks może być równy długości, więc ograniczamy
    if (index >= colorPalette.length) index = colorPalette.length - 1;
  
    // Odwracamy indeks, żeby wyższe lata miały kolor z początku palety
    const reversedIndex = colorPalette.length - 1 - index;
  
    return [...colorPalette[reversedIndex], 180];
  }
  

  // Inicjalizacja mapy
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

    return () => {
      map.remove();
    };
  }, []);


  // Aktualizacja warstwy Deck.GL na mapie
  useEffect(() => {
    if (!overlayRef.current) return;

    const layer = new ScatterplotLayer({
      id: 'deckgl-circle',
      data: filteredFeatures,
      getPosition: d => d.geometry.coordinates,
      radiusMinPixels: 1.5,
      radiusScale: 2,
      getFillColor: d => getColorForYear(d.properties.rok_wykonania),
      pickable: false,
    });

    overlayRef.current.setProps({ layers: [layer] });
  }, [features, filteredFeatures]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Legenda */}
      <div
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
      </div>
    </div>
  );
}

export default MapComponent;
