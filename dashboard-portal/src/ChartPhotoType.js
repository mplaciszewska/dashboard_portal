import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import './ChartPhotoType.css';

const COLORS= {
  "Analogowe": '#A16928',
  "Cyfrowe": '#23687B'
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


export function ChartPhotoType ( { features, stats }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const result = groupPhotoType(features, stats);
            setData(result);
        }, 300); // debounce 300ms

        return () => clearTimeout(timeout);
    }, [features, stats]);

    return (
        <div className="chart-phototype-container">
            <h4>Zdjęcia według źródła</h4>
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
                    {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#ccc'} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="left" verticalAlign="middle" iconSize={12}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}