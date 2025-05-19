import { useState, useEffect } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export function useFilterFeaturesByPolygon(features, polygon) {
  const [filteredFeatures, setFilteredFeatures] = useState(features || []);

  useEffect(() => {
    if (!polygon) {
      setFilteredFeatures(features);
      return;
    }
    if (!features || features.length === 0) {
      setFilteredFeatures([]);
      return;
    }

    const filtered = features.filter(feature => booleanPointInPolygon(feature, polygon));
    setFilteredFeatures(filtered);
  }, [features, polygon]);

  return filteredFeatures;
}
