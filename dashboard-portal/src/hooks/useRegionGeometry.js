import { useState, useEffect } from "react";

export const useRegionGeometry = (level, jptKod, nazwa) => {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    if (!level || !jptKod) {
      setGeometry(null);
      return;
    }

    const controller = new AbortController();

    fetch(`http://localhost:8000/api/region?level=${level}&jpt_kod=${jptKod}`,
          { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setGeometry)
      .catch(() => setGeometry(null));

    return () => controller.abort();
  }, [level, jptKod, nazwa]);

  return geometry;
};
