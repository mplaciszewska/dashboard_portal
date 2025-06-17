import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ChartColor.css';

const COLORS = [
  '#23687B',
  '#2887A1',
  '#79A7AC',
  '#B5C8B8',
  '#EDEAC2',
  '#D6BD8D',
  '#BD925A',
  '#A16928',
];
  
function groupColors(features) {
  if(!Array.isArray(features)) return [];

  const counts = {};

  features.forEach((feature) => {
    const kolor = feature?.properties?.kolor ?? 'Nieznany';
    counts[kolor] = (counts[kolor] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function ChartColor({ features }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!Array.isArray(features) || features.length === 0) {
      setData([]);
      return;
    }

    const timeout = setTimeout(() => {
      const result = groupColors(features);
      setData(result);
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [features]);

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