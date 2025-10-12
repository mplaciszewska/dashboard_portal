import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import './Chart.css';
import { tooltipStyle } from './theme/tooltip';
import { colors } from './theme/colors';


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const group = payload[0].payload.name;
    return (
      <div style={tooltipStyle}>
        <strong>{group}</strong>: {payload[0].value}<br />
      </div>
    );
  }
  return null;
};

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
    <div className="chart-container">
      <div className="chart-header">
        <h3 style={{ marginBottom: '7px' }}>Zdjęcia według roku wykonania</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 1 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval="preserveStartEnd" 
              angle={-45} 
              textAnchor="end" 
              height={50} 
              fontSize={13}
            />
            <YAxis fontSize={13}/>
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="count" fill={colors.secondaryOpaque} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
