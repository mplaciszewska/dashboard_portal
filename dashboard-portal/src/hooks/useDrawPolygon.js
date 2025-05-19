import { useState, useEffect } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { polygon } from '@turf/helpers';

export function useDrawPolygon(map) {
  const [drawnPolygon, setDrawnPolygon] = useState(null);

  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: true,
      clickBuffer: 0,
      controls: {
        polygon: true,
        line_string: false,
        point: false,
        trash: true,
        combine_features: false,
        uncombine_features: false,
        
      },
      styles: [
    // Wypełnienie poligonu
    {
      id: 'custom-draw-polygon-fill',
      type: 'fill',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: {
        'fill-color': '#800020', // burgundowy
        'fill-opacity': 0.1,
      },
    },
    // Obramowanie
    {
      id: 'custom-draw-polygon-stroke',
      type: 'line',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: {
        'line-color': '#5A001E', // ciemniejszy burgund
        'line-width': 2,
      },
    },
    // Punkty kontrolne (halo)
    {
      id: 'custom-draw-vertex-halo',
      type: 'circle',
      filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
      paint: {
        'circle-radius': 10,
        'circle-color': '#FFF',
      },
    },
    // Punkty kontrolne (rdzeń)
    {
      id: 'custom-draw-vertex',
      type: 'circle',
      filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
      paint: {
        'circle-radius': 6,
        'circle-color': '#800020', // burgund
      },
    },
  ]
    });

    map.addControl(draw, 'top-left');

    const onDrawCreate = e => {
      const newPolygon = polygon(e.features[0].geometry.coordinates);
      setDrawnPolygon(newPolygon);
    };

    const onDrawUpdate = e => {
      const newPolygon = polygon(e.features[0].geometry.coordinates);
      setDrawnPolygon(newPolygon);
    };

    const onDrawDelete = () => {
      setDrawnPolygon(null);
    };

    map.on('draw.create', onDrawCreate);
    map.on('draw.update', onDrawUpdate);
    map.on('draw.delete', onDrawDelete);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.update', onDrawUpdate);
      map.off('draw.delete', onDrawDelete);
      map.removeControl(draw);
    };
  }, [map]);

  return drawnPolygon;
}
