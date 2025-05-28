import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import './YearChart.css';

function groupYears(features) {
    if (!Array.isArray(features)) return [];
  
    const bins = {};
    let minYear = Infinity;
    let maxYear = -Infinity;
  
    for (let i = 0; i < features.length; i++) {
      const year = features[i]?.properties?.rok_wykonania;
      if (typeof year === 'number' && year >= 1900 && year <= 2100) {
        if (year < minYear) minYear = year;
        if (year > maxYear) maxYear = year;
  
        bins[year] = (bins[year] || 0) + 1;
      }
    }
  
    if (minYear === Infinity) return [];
  
    const range = maxYear - minYear;
    let step;
    if (range <= 10) step = 1;
    else if (range <= 30) step = 5;
    else if (range <= 100) step = 10;
    else step = 20;
  
    const grouped = {};
    for (const yearStr in bins) {
      const year = parseInt(yearStr);
      const groupStart = year - (year % step);
      grouped[groupStart] = (grouped[groupStart] || 0) + bins[yearStr];
    }
  
    return Object.entries(grouped)
      .map(([start, count]) => ({
        name: step === 1 ? `${start}` : `${start}–${+start + step - 1}`,
        count,
        sortKey: +start
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
      <h3 style={{ fontSize: '16px', marginBottom: '17px', marginTop: '5px' }}>Zdjęcia według roku wykonania</h3>
      <ResponsiveContainer width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={60} fontSize={14}/>
          <YAxis fontSize={14}/>
          <Tooltip />
          <Bar dataKey="count" fill="#2c7fb8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
