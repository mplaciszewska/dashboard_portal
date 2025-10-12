import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chart.css';
import { colorPalette, rgba } from './theme/colors';
import { tooltipStyle } from './theme/tooltip';


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


const COLORS = [
  rgba(colorPalette[8]),
  rgba(colorPalette[7]),
  rgba(colorPalette[6]),
  rgba(colorPalette[5]),
  rgba(colorPalette[2]),
  rgba(colorPalette[1]),
  rgba(colorPalette[4]),
  rgba(colorPalette[3]),
];
  
function groupColors(features, stats) {
  const counts = {};

  if (stats) {
    Object.entries(stats.color || {}).forEach(([color, value]) => {
      counts[color] = value;
    });
  } else if (Array.isArray(features)) {
    features.forEach((feature) => {
      const kolor = feature?.properties?.kolor ?? 'Nieznany';
      counts[kolor] = (counts[kolor] || 0) + 1;
    });
  }

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}


export function ChartColor({ features, stats }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = groupColors(features, stats);
      setData(result);
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [features, stats]);

    // if (data.length === 0) return <p style={{ padding: '1rem' }}>Brak danych do wyświetlenia.</p>;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Zdjęcia według koloru</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer padding="0" width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip}/>
            <Legend layout="vertical" align="left" verticalAlign="middle" iconSize={12}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}