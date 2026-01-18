import { useState, useEffect, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';


export function useDrawPolygon(map, regionGeometry, { onDrawingChange } = {}) {
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const drawRef = useRef(null);
  const drawnPolygonIdRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      clickBuffer: 0,
      controls: {},
      modes: Object.assign({
        draw_polygon: MapboxDraw.modes.draw_polygon,
        draw_rectangle: DrawRectangle
      }, MapboxDraw.modes),
      styles: [
        {
          id: 'custom-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: { 'fill-color': '#800020', 'fill-opacity': 0.05 },
        },
        {
          id: 'custom-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: { 'line-color': '#5A001E', 'line-width': 2 },
        },
        {
          id: 'custom-draw-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: { 'circle-radius': 6, 'circle-color': '#800020' },
        },
      ],
    });

    drawRef.current = draw;
    map.addControl(draw, 'top-left');

    const clearPolygon = () => {
      if (!drawRef.current || !drawnPolygonIdRef.current) return;
      drawRef.current.delete([drawnPolygonIdRef.current]);
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
    };

    const onDrawCreate = e => {
      if (drawnPolygonIdRef.current) clearPolygon();
      const newFeature = e.features[0];
      drawnPolygonIdRef.current = newFeature.id;
      setDrawnPolygon(newFeature.geometry);
      onDrawingChange?.(true);
    };

    const onDrawUpdate = e => {
      const updatedFeature = e.features[0];
      drawnPolygonIdRef.current = updatedFeature.id;
      setDrawnPolygon(updatedFeature.geometry);
      onDrawingChange?.(true);
    };

    const onDrawDelete = e => {
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
      onDrawingChange?.(true);
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
  }, [map, onDrawingChange]);

  useEffect(() => {
    if (regionGeometry && drawRef.current) {
      drawRef.current.deleteAll();
      setDrawnPolygon(null);
      drawnPolygonIdRef.current = null;
    }
  }, [regionGeometry]);

  const drawPolygon = () => {
    if (!drawRef.current) return;
    drawRef.current.changeMode('draw_polygon');
    onDrawingChange?.(false);
  };

  const drawRectangle = () => {
    if (!drawRef.current) return;
    drawRef.current.changeMode('draw_rectangle');
    onDrawingChange?.(false);
  };

  const deletePolygon = () => {
    if (!drawRef.current || !drawnPolygonIdRef.current) return;
    drawRef.current.delete([drawnPolygonIdRef.current]);
    setDrawnPolygon(null);
    drawnPolygonIdRef.current = null;
  };

  return { drawnPolygon, drawPolygon, drawRectangle, deletePolygon };
}
