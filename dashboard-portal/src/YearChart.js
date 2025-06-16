import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import './YearChart.css';

function groupYears(features) {
  if (!Array.isArray(features)) return [];

  const bins = {};

  for (let feature of features) {
    const year = feature?.properties?.rok_wykonania;
    if (typeof year === 'number' && year >= 1900 && year <= 2100) {
      bins[year] = (bins[year] || 0) + 1;
    }
  }

  // Zamieniamy słownik na tablicę posortowaną po roku
  return Object.entries(bins)
    .map(([year, count]) => ({
      name: year.toString(),
      count: count,
      sortKey: +year
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
}




export function YearChart({ features }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!Array.isArray(features) || features.length === 0) {
      setData([]);
      return;
    }

    const timeout = setTimeout(() => {
      const result = groupYears(features);
      setData(result);
    }, 300); // debounce na 300ms

    return () => clearTimeout(timeout);
  }, [features]);

  // if (data.length === 0) return <p style={{ padding: '1rem' }}>Brak danych do wyświetlenia.</p>;

  return (
    <div className="year-chart-container">
      <h4>Zdjęcia według roku wykonania</h4>
      <ResponsiveContainer width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
  dataKey="name" 
  interval="preserveStartEnd" 
  angle={-45} 
  textAnchor="end" 
  height={60} 
  fontSize={13}
/>
          <YAxis fontSize={14}/>
          <Tooltip />
          <Bar dataKey="count" fill="#79A7AC" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
