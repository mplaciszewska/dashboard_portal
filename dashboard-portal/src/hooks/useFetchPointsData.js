import { useState, useEffect, useRef } from 'react';

export function useFetchPointsData({ limit = 500000, polygon = null }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState([true])
  const skip = useRef(0);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setFeatures([]);
    skip.current = 0;

    const fetchData = async () => {
      try {
        if (polygon) {
          console.log("Wysyłam do backendu polygon:", polygon);
          const recursiveFetchPoly = async () => {
            const response = await fetch('http://localhost:8000/api/zdjecia/filter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                polygon: polygon,
                skip:    skip.current,
                limit
              })
            });
            const data = await response.json();

            if (isCancelled) return;
            if (!data.features || data.features.length === 0) {
              setLoading(false);
              return;
            }
            setFeatures(prev => [...prev, ...data.features]);
            skip.current += limit;
            await recursiveFetchPoly();
          };

          await recursiveFetchPoly();
        } else {
          // set features to something because vector tiles are here
          setFeatures([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Błąd podczas pobierania danych:', err);
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [limit, polygon]);

  return {features, loading};
}
