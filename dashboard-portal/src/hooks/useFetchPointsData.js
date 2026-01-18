import { useState, useEffect, useRef, useMemo } from 'react';

export function useFetchPointsData({ limit = 500_000, polygon = null }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const skip = useRef(0);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setFeatures([]);
    skip.current = 0;

    const fetchData = async () => {
      try {
        if (polygon) {
          const recursiveFetchPoly = async () => {
            const response = await fetch('http://localhost:8000/api/zdjecia/filter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ polygon, skip: skip.current, limit })
            });
            if (!response.ok) {
              console.error('Server error', response.status);
              setLoading(false);
              return;
            }
            const data = await response.json();
            if (isCancelled) return;
            if (!data.features?.length) {
              setLoading(false);
              return;
            }
            setFeatures(prev => {
              const next = [...prev, ...data.features];
              return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
            });
            skip.current += limit;
            await recursiveFetchPoly();
          };
          await recursiveFetchPoly();
        } else {
          setFeatures([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Fetch error', err);
        setLoading(false);
      }
    };

    fetchData();
    return () => { isCancelled = true; };
  }, [limit, polygon]);

  return useMemo(() => ({ features, loading }), [features, loading]);
}