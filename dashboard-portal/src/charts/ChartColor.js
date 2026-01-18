import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chart.css';
import { colorPalette, rgba } from '../theme/colors';
import { tooltipStyle } from '../theme/tooltip';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const group = payload[0].name;
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

export function ChartColor({ features, stats, onCategoryClick, selectedCategory }) {
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = groupColors(features, stats);
      setData(result);
    }, 300); // debounce 300ms
    return () => clearTimeout(timeout);
  }, [features, stats]);

  useEffect(() => {
    if (selectedCategory && !stats) {
      const index = data.findIndex(item => item.name === selectedCategory);
      setActiveIndex(index >= 0 ? index : null);
    } else {
      setActiveIndex(null);
    }
  }, [selectedCategory, data, stats]);

  const handleClick = stats
    ? undefined
    : (data, index) => {
        if (activeIndex === index) {
          setActiveIndex(null);
          onCategoryClick?.(null);
        } else {
          setActiveIndex(index);
          onCategoryClick?.(data.name);
        }
      };

  const getFillColor = (index) => {
    if (activeIndex === null) {
      return COLORS[index % COLORS.length];
    }
    if (activeIndex === index) {
      return COLORS[index % COLORS.length];
    }
    const color = COLORS[index % COLORS.length];
    return color;
  };

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
              onClick={handleClick}
              cursor={stats ? "default" : "pointer"}
              activeIndex={activeIndex}
              activeShape={{
                stroke: '#333',
                strokeWidth: 2
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getFillColor(index)}
                  stroke={activeIndex === index ? '#333' : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip}/>
            <Legend
              layout="vertical"
              align="left"
              verticalAlign="middle"
              iconSize={12}
              onClick={stats ? undefined : (legendEntry) => {
                const idx = data.findIndex((d) => d.name === legendEntry.payload.name);
                if (idx !== -1) handleClick(legendEntry.payload, idx);
              }}
              wrapperStyle={{ cursor: stats ? 'default' : 'pointer' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}