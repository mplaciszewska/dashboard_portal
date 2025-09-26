import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ChartColor.css';
import { colorPalette, rgba } from './theme/colors';

const COLORS = [
  rgba(colorPalette[7]),
  rgba(colorPalette[6]),
  rgba(colorPalette[5]),
  rgba(colorPalette[4]),
  rgba(colorPalette[1]),
  rgba(colorPalette[0]),
  rgba(colorPalette[3]),
  rgba(colorPalette[2]),
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
    <div className="chart-color-container">
      <h4>Zdjęcia według koloru</h4>
        <ResponsiveContainer padding="0" width="100%" height="80%">
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
            <Tooltip />
            <Legend layout="vertical" align="left" verticalAlign="middle" iconSize={12}/>
          </PieChart>
        </ResponsiveContainer>
    </div>
  );
}