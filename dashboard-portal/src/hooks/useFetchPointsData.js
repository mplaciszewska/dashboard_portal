import { useState, useEffect, useRef } from 'react';

export function useFetchPointsData({ limit = 500000, polygon = null }) {
  const [features, setFeatures] = useState([]);
  const skip = useRef(0);

  useEffect(() => {
    let isCancelled = false;

    setFeatures([]);
    skip.current = 0;

    const fetchData = async () => {
      try {
        if (polygon) {
          console.log("Fetchowanie danych...", polygon);
          const response = await fetch('http://localhost:8000/api/zdjecia/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ polygon: polygon.geometry }),
          });
          const data = await response.json();
          if (!isCancelled) {
            setFeatures(data.features || []);
          }
        } else {
          const recursiveFetch = async () => {
            console.log("Fetchowanie danych...");
            const response = await fetch(`http://localhost:8000/api/zdjecia?skip=${skip.current}&limit=${limit}`);
            console.log("Odpowiedź z serwera:", response);
            const data = await response.json();

            if (isCancelled || !data.features.length) return;

            setFeatures(prev => [...prev, ...data.features]);
            skip.current += limit;
            await recursiveFetch();
          };

          await recursiveFetch();
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

  return features;
}
