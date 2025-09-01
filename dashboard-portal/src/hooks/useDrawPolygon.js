import { useState, useEffect, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

export function useDrawPolygon(map, regionGeometry) {
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const drawRef = useRef(null);
  const drawnPolygonIdRef = useRef(null); // Ref do zapamiętania aktualnego id poligonu

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
        {
          id: 'custom-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#800020',
            'fill-opacity': 0.05,
          },
        },
        {
          id: 'custom-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#5A001E',
            'line-width': 2,
          },
        },
        {
          id: 'custom-draw-vertex-halo',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 10,
            'circle-color': '#FFF',
          },
        },
        {
          id: 'custom-draw-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#800020',
          },
        },
      ],
    });

    drawRef.current = draw;

    map.addControl(draw, 'top-left');

    const clearPolygon = () => {
      const data = draw.getAll();
      if (!data.features.length) return;

      const lastId = data.features[data.features.length - 1].id;
      const pids = data.features
        .filter(f => f.geometry.type === 'Polygon' && f.id !== lastId)
        .map(f => f.id);

      draw.delete(pids);
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
    };

    const onDrawCreate = e => {
      const newFeature = e.features[0];
      setDrawnPolygon(newFeature.geometry);
      drawnPolygonIdRef.current = newFeature.id;
    };

    const onDrawUpdate = e => {
      const updatedFeature = e.features[0];
      setDrawnPolygon(updatedFeature.geometry);
      drawnPolygonIdRef.current = updatedFeature.id;
    };

    const onDrawDelete = () => {
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
    };

    const onDrawSelectionChange = e => {
      if (e.features.length > 0) {
        const selectedFeature = e.features[0];
        if (drawnPolygonIdRef.current !== selectedFeature.id) {
          setDrawnPolygon(selectedFeature.geometry);
          drawnPolygonIdRef.current = selectedFeature.id;
        }
        // jeśli to ten sam poligon, nic nie robimy, żeby uniknąć zbędnego renderu
      } else {
        setDrawnPolygon(null);
        drawnPolygonIdRef.current = null;
      }
    };

    const onModeChange = () => {
      if (draw.getMode() === 'draw_polygon') {
        clearPolygon();
      }
    };

    map.on('draw.create', onDrawCreate);
    map.on('draw.update', onDrawUpdate);
    map.on('draw.delete', onDrawDelete);
    map.on('draw.selectionchange', onDrawSelectionChange);
    map.on('draw.modechange', onModeChange);

    return () => {
      map.off('draw.create', onDrawCreate);
      map.off('draw.update', onDrawUpdate);
      map.off('draw.delete', onDrawDelete);
      map.off('draw.selectionchange', onDrawSelectionChange);
      map.off('draw.modechange', onModeChange);
      map.removeControl(draw);
    };
  }, [map]);

    useEffect(() => {
    if (regionGeometry && drawRef.current) {
      drawRef.current.deleteAll();
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
    }
  }, [regionGeometry]);

  return drawnPolygon;
}