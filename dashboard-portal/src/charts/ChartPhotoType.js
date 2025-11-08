import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import './Chart.css';
import { colorPalette, rgba } from '../theme/colors';
import { tooltipStyle } from '../theme/tooltip';


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

const COLORS = {
  "Analogowe": rgba(colorPalette[1]),
  "Cyfrowe": rgba(colorPalette[8])
};

function groupPhotoType(features, stats) {
    const counts = {};

    if (stats && stats.photo_type) {
        Object.entries(stats.photo_type).forEach(([photo_type, value]) => {
            const totalCount = Object.values(value.resolution || {}).reduce((sum, c) => sum + c, 0);
            counts[photo_type] = totalCount;
        });
    } else if (Array.isArray(features)) {
        features.forEach(feature => {
            const photo_type = feature.properties?.zrodlo_danych;
            counts[photo_type] = (counts[photo_type] || 0) + 1;
        });
    }

    const labelMap = {
        "Zdj. analogowe": "Analogowe",
        "Zdj. cyfrowe": "Cyfrowe"
    };

    return Object.entries(counts).map(([name, value]) => ({
        name: labelMap[name] || name,
        value
    }));
}


export function ChartPhotoType ( { features, stats, onCategoryClick, selectedCategory }) {
    const [data, setData] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const result = groupPhotoType(features, stats);
            setData(result);
        }, 300); // debounce 300ms

        return () => clearTimeout(timeout);
    }, [features, stats]);

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


    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Zdjęcia według źródła</h3>
            </div>
            <div className="chart-content">
                <ResponsiveContainer padding="10" width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={180}
                        endAngle={0}
                        cx="50%"
                        cy="70%"
                        outerRadius={80}
                        innerRadius={50}
                        onClick={handleClick}
                        cursor={stats ? "default" : "pointer"}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.name] || '#ccc'}
                            stroke={activeIndex === index ? '#333' : 'none'}
                            strokeWidth={activeIndex === index ? 2 : 0} />
                        ))}
                    </Pie>
                    <Tooltip content={CustomTooltip}/>
                    <Legend layout="horizontal" align="middle" verticalAlign="bottom" iconSize={12} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}