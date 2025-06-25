import { useState, useEffect, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

export function useDrawPolygon(map) {
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const drawRef = useRef(null);

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
  ]
    });

        drawRef.current = draw;

    map.addControl(draw, 'top-left');

    const clearPolygon = () => {
      const data = draw.getAll();
      var pids = []
      const lid = data.features[data.features.length - 1].id

      data.features.forEach((f) => {
        if (f.geometry.type === 'Polygon' && f.id !== lid) {
          pids.push(f.id)
        }
      })
      draw.delete(pids)
      setDrawnPolygon(null);
    };

    const onDrawCreate = e => {
      const newPolygon = e.features[0].geometry;
      setDrawnPolygon(newPolygon);
    };

    const onDrawUpdate = e => {
      const newPolygon = e.features[0].geometry;
      setDrawnPolygon(newPolygon);
    };

    const onDrawDelete = () => {
      setDrawnPolygon(null);
    };

    const onDrawSelectionChange = e => {
      if (e.features.length > 0) {
        const selectedPolygon = e.features[0].geometry;
        setDrawnPolygon(selectedPolygon);
      } else {
        setDrawnPolygon(null);
      }
    };

    const onModeChange = (e) => {
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

    return drawnPolygon;

  //  return {
  //   polygon: drawnPolygon,
  //   clearPolygon: () => {
  //     if (drawRef.current) {
  //       drawRef.current.deleteAll();
  //       setDrawnPolygon(null);
  //     }
  //   }
  // };
}
