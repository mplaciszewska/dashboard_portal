import { colors, rgba } from '../theme/colors';
import { SCATTERPLOT_CONFIG } from './constants';


export function getColorForYear(year, yearGroups) {
  if (!yearGroups || !yearGroups.length) return colors.primary;
  
  const group = yearGroups.find(({ range }) => year >= range[0] && year <= range[1]);
  return group ? group.color : colors.primary;
}


export function createColorExpression(yearGroups) {
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
}


export function calculateRadiusScale(zoomLevel) {
  const { zoomThreshold, zoomPower, zoomScale } = SCATTERPLOT_CONFIG;
  return 1 + Math.max(0, Math.pow((zoomLevel - zoomThreshold), zoomPower) * zoomScale);
}


export function extractPopupFeatures(pickedObject) {
  return {
    url: pickedObject.object?.properties?.url_do_pobrania || null,
    rok_wykonania: pickedObject.object?.properties?.rok_wykonania || null,
    data_nalotu: pickedObject.object?.properties?.data_nalotu || null,
    rozdzielczosc: pickedObject.object?.properties?.charakterystyka_przestrzenna || null,
    kolor: pickedObject.object?.properties?.kolor || null,
    typ_zdjecia: pickedObject.object?.properties?.zrodlo_danych || null,
    nr_zgloszenia: pickedObject.object?.properties?.numer_zgloszenia || null,
    dt_pzgik: pickedObject.object?.properties?.dt_pzgik || null,
  };
}


export function createScatterplotClickHandler(overlayRef, setPopup) {
  return async (info) => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const pickedObjects = overlay.pickMultipleObjects({
      x: info.x,
      y: info.y,
      radius: 4,
      layerIds: ['scatterplot-layer']
    }) || [];

    const features = pickedObjects.map(extractPopupFeatures);

    setPopup({
      x: info.x,
      y: info.y,
      features
    });
  };
}
