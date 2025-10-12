
import React from 'react';
import { useState, useEffect } from 'react';
import { ComposedChart, Tooltip, ResponsiveContainer, Bar, XAxis, YAxis, Cell } from 'recharts';
import './Chart.css';
import { colorPalette, rgba, colors } from './theme/colors';
import { tooltipStyle } from './theme/tooltip';


const COLORS = {
  "Okres wegetacji": rgba(colorPalette[5]),
  "Poza wegetacją": rgba(colorPalette[4]),
  "Brak danych": colors.backgroundDark
};

const getMonthsForGroup = (group) => {
  switch (group) {
    case 'Okres wegetacji':
      return 'Kwiecień - Wrzesień';
    case 'Poza wegetacją':
      return 'Listopad - Marzec';
    default:
      return;
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const group = payload[0].payload.name;
    const months = getMonthsForGroup(group);
    return (
      <div style={tooltipStyle}>
        <strong>{group}</strong>: {payload[0].value}<br />
        {months}
      </div>
    );
  }
  return null;
};


function groupVegetation(features, stats) { 
  const isValidDate = (str) => /^\d{4}-\d{2}-\d{2}$/.test(str.trim());
  const isValidMonth = (str) => /^\d{4}-\d{2}$/.test(str.trim());

  if (stats && stats.flight_dates) {
    const bins = {};
    Object.entries(stats.flight_dates).forEach(([rawDate, value]) => {
      const date = rawDate.replaceAll('"', '').trim();
      let veg_type = 'Brak danych';
      let month = null;
      if (isValidDate(date)) {
        const d = new Date(date);
        month = d.getMonth() + 1;
      } else if (isValidMonth(date)) {
        month = parseInt(date.split('-')[1], 10);
      }
      if (month !== null && !isNaN(month)) {
        if (month >= 4 && month <= 9) {
          veg_type = 'Okres wegetacji';
        } else if ([10,11,12,1,2,3].includes(month)) {
          veg_type = 'Poza wegetacją';
        }
      }
      bins[veg_type] = (bins[veg_type] || 0) + value;
    });
    return Object.entries(bins).map(([name, value]) => ({ name, value }));
  } else if (Array.isArray(features)) {
    const counts = {};
    features.forEach((feature) => {
      const rawDate = feature?.properties?.data_nalotu;
      const date = rawDate ? rawDate.replaceAll('"', '').trim() : '';
      let veg_type = 'Brak danych';
      let month = null;
      if (isValidDate(date)) {
        const d = new Date(date);
        month = d.getMonth() + 1;
      } else if (isValidMonth(date)) {
        month = parseInt(date.split('-')[1], 10);
      }
      if (month !== null && !isNaN(month)) {
        if (month >= 4 && month <= 9) {
          veg_type = 'Okres wegetacji';
        } else if ([10,11,12,1,2,3].includes(month)) {
          veg_type = 'Poza wegetacją';
        }
      }
      counts[veg_type] = (counts[veg_type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }
}

export function ChartVegetation({ features, stats }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = groupVegetation(features, stats);
      setData(result);
    }, 300);
    return () => clearTimeout(timeout);
  }, [features, stats]);


  return (
    <div className="chart-container" style={{ fontSize: '12px' }}>
      <div className="chart-header" style={{ marginBottom: '4px' }}>
        <h3>Zdjęcia według daty nalotu</h3>
      </div>
      <div className="chart-content" style={{ height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            layout="vertical"
            width={320}
            height={100}
            data={data}
            margin={{
              top: 25,
              right: 8,
              bottom: 8,
              left: 15,
            }}
          >
            <XAxis type="number" tick={{ fontSize: 12 }} padding={{ left: 0.5, right: 0 }} />
            <YAxis dataKey="name" type="category" scale="point" tick={{ fontSize: 13 }} padding={{ top: 0, bottom: 15 }} />
            <Tooltip content={CustomTooltip} />
            <Bar dataKey="value" barSize={18} radius={[0, 2, 2, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#ccc'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}