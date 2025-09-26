import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush } from 'recharts';
import { useState, useEffect } from 'react';
import './ChartYear.css';

function groupYears(features, stats) {
  const bins = {};

  if (stats) {
    Object.entries(stats.years).forEach(([year, count]) => {
      bins[year] = count;
    });
  } else {
    features.forEach(feature => {
      const year = feature.properties?.rok_wykonania;
      if (typeof year === 'number' && year >= 1900 && year <= 2100) {
        bins[year] = (bins[year] || 0) + 1;
      }
    });
  }

  return Object.entries(bins)
    .map(([year, count]) => ({
      name: year.toString(),
      count: count,
      sortKey: +year
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

export function ChartYear({ features, stats }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = groupYears(features, stats);
      setData(result);
    }, 300); // debounce na 300ms

    return () => clearTimeout(timeout);
  }, [features, stats]);

  // if (data.length === 0) return <p style={{ padding: '1rem' }}>Brak danych do wyświetlenia.</p>;

  return (
    <div className="year-chart-container">
      <h4>Zdjęcia według roku wykonania</h4>
      <ResponsiveContainer width="100%"  height="100%" >
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
          <YAxis fontSize={13}/>
          <Tooltip />
          <Bar dataKey="count" fill="#79A7AC" />
          {/* <Brush dataKey="name" height={30} stroke="#79A7AC" /> */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
