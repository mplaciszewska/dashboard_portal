import { vegetationCategoryFilter } from '../charts/ChartVegetation';
import { colorPalette } from '../theme/colors';
import { DEFAULT_YEAR_RANGE } from './constants';


export function generateYearGroups(minYear, maxYear) {
  const groupCount = colorPalette.length;
  const range = maxYear - minYear + 1;
  const step = Math.ceil(range / groupCount);

  return colorPalette.map((c, i) => {
    const start = minYear + i * step;
    const end = Math.min(minYear + (i + 1) * step - 1, maxYear);
    return {
      range: [start, end],
      label: `${start}-${end}`,
      color: c,
    };
  });
}


export function isFeatureInCategory(feature, selectedCategory) {
  if (!selectedCategory || !feature?.properties) return true;
  
  const { chartType, value } = selectedCategory;
  const props = feature.properties;

  switch (chartType) {
    case 'color':
      return props.kolor === value;

    case 'resolution': {
      const featVal = props.charakterystyka_przestrzenna;
      if (featVal == null) return false;
      const featNum = Number(featVal);
      const selectedNum = Number(value);
      return Math.abs(featNum - selectedNum) < 1e-6;
    }

    case 'photoType': {
      const labelMap = {
        "Analogowe": "Zdj. analogowe",
        "Cyfrowe": "Zdj. cyfrowe"
      };
      return props.zrodlo_danych === labelMap[value];
    }

    case 'date':
      return props.dt_pzgik === value;

    case 'vegetation': {
      const filterFn = vegetationCategoryFilter[value];
      if (!filterFn) return false;

      const rawDate = props.data_nalotu;
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate?.trim());
      const isValidMonth = /^\d{4}-\d{2}$/.test(rawDate?.trim());
      
      let month = null;
      if (isValidDate) {
        month = new Date(rawDate).getMonth() + 1;
      } else if (isValidMonth) {
        month = parseInt(rawDate.split('-')[1], 10);
      }

      return filterFn(month);
    }

    case 'reportNumber':
      return props.numer_zgloszenia === value;

    default:
      return true;
  }
}


export function filterFeaturesByCategory(features, selectedCategory) {
  if (!features.length || !selectedCategory) return features;

  const out = [];
  for (let i = 0; i < features.length; i++) {
    if (isFeatureInCategory(features[i], selectedCategory)) {
      out.push(features[i]);
    }
  }
  
  return out;
}


export function filterFeaturesByYear(features, yearRange, absoluteRange) {
  if (!features.length) return [];

  const [min, max] = yearRange;
  const [absoluteMin, absoluteMax] = absoluteRange;

  if (min === absoluteMin && max === absoluteMax) {
    return features;
  }

  const out = [];
  for (let i = 0; i < features.length; i++) {
    const year = features[i].properties?.rok_wykonania;
    if (typeof year === 'number' && year >= min && year <= max) {
      out.push(features[i]);
    }
  }

  return out;
}


export function getYearRangeFromFeatures(features) {
  if (!features.length) return DEFAULT_YEAR_RANGE;

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < features.length; i++) {
    const year = features[i].properties?.rok_wykonania;
    if (Number.isFinite(year)) {
      if (year < min) min = year;
      if (year > max) max = year;
    }
  }

  return Number.isFinite(min) ? [min, max] : DEFAULT_YEAR_RANGE;
}
