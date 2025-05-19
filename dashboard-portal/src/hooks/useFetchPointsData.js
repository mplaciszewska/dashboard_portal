import { useState, useEffect, useRef } from 'react';

export function useFetchPointsData({ limit = 500000, polygon = null }) {
  const [features, setFeatures] = useState([]);
  const skip = useRef(0);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        if (polygon) {
          // pobieranie z poligonem
          const response = await fetch('http://localhost:8000/api/zdjecia/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ polygon }),
          });
          const data = await response.json();
          if (!isCancelled) setFeatures(data.features || []);
        } else {
          // domyślne pobieranie wszystkich danych
          skip.current = 0;
          setFeatures([]);

          const recursiveFetch = async () => {
            const response = await fetch(`http://localhost:8000/api/zdjecia?skip=${skip.current}&limit=${limit}`);
            const data = await response.json();
            if (isCancelled || !data.features.length) return;
            setFeatures(prev => [...prev, ...data.features]);
            skip.current += limit;
            recursiveFetch();
          };

          recursiveFetch();
        }
      } catch (err) {
        console.error('Błąd podczas pobierania danych:', err);
      }
    };

    fetchData();
    return () => { isCancelled = true; };
  }, [limit, polygon]);

  return features;
}
