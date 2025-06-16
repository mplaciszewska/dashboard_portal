import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import './ColorChart.css';

// const COLORS = [
//     '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
//     '#FF9F40', '#8BC34A', '#E91E63', '#00BCD4', '#795548',
//   ];
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
  
  // Funkcja grupująca kolory
  function groupColors(features) {
    const counts = {};
    features.forEach((feature) => {
      const kolor = feature.properties?.kolor ?? 'Nieznany';
      counts[kolor] = (counts[kolor] || 0) + 1;
    });
  
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }
  
  export function ColorChart({ features }) {
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
      <div className="colorchart-container">
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
              <Legend layout="vertical" align="left" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
      </div>
    );
  }