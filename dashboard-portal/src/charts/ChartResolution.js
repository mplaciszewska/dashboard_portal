import React, { useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from 'recharts';
import './Chart.css';
import './ChartResolution.css';
import { tooltipStyle } from '../theme/tooltip';
import { colorPalette, rgba } from '../theme/colors';


// ...existing code...
const CustomTooltip = ({ active, payload, label, chartType }) => {
  if (active && payload && payload.length) {
    const group = payload[0].payload.name;
    let displayGroup;

    if (chartType === 'analog') {
      // analogowe: show as scale "1 : {group}"
      displayGroup = `1 : ${group}`;
    } else {
      // cyfrowe: show as meters "X m"
      displayGroup = `${group} m`;
    }

    return (
      <div style={tooltipStyle}>
        <strong>{displayGroup}</strong>: {payload[0].value}<br />
      </div>
    );
  }
  return null;
};
// ...existing code...

function calculateStats(data) {
  if (!data || data.length === 0) {
    return { mostCommon: null, average: null };
  }

  let mostCommonItem = data.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), data[0]);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const weightedSum = data.reduce((sum, item) => sum + (parseFloat(item.name) * item.count), 0);
  const average = totalCount ? weightedSum / totalCount : null;

  return {
    mostCommon: mostCommonItem.name,
    average: average.toFixed(2)
  };
}

function groupResolution(features, stats) {
  if (stats && stats.photo_type) {
    const binsAnalog = {};
    const binsCyfr = {};

    Object.entries(stats.photo_type).forEach(([photo_type, value]) => {
      const isAnalog = photo_type.includes('analog');
      const targetBin = isAnalog ? binsAnalog : binsCyfr;

      Object.entries(value.resolution || {}).forEach(([res, count]) => {
        let numeric = isNaN(res) ? res : Number(res);
        targetBin[numeric] = (targetBin[numeric] || 0) + count;
      });
    });

    const normalize = bins =>
      Object.entries(bins)
        .map(([name, count]) => ({
          name,
          count,
          sortKey: parseFloat(name) || 0
        }))
        .sort((a, b) => a.sortKey - b.sortKey);

    return {
      analogData: normalize(binsAnalog),
      cyfrData: normalize(binsCyfr)
    };
  }


  const binsAnalog = {};
  const binsCyfr = {};
  features.forEach(feature => {
    const type = feature.properties?.zrodlo_danych;
    let resolution = feature.properties?.charakterystyka_przestrzenna;

    if (type === 'Zdj. cyfrowe') {
      binsCyfr[resolution] = (binsCyfr[resolution] || 0) + 1;
    } else if (type === 'Zdj. analogowe') {
      const numeric = typeof resolution === 'string'
        ? parseFloat(resolution.replace(/[^0-9.]/g, ''))
        : resolution;
      if (isNaN(numeric)) return;
      const rounded = Math.floor(numeric / 100) * 100;
      binsAnalog[rounded] = (binsAnalog[rounded] || 0) + 1;
    }
  });

  const normalize = bins =>
    Object.entries(bins)
      .map(([name, count]) => ({
        name,
        count,
        sortKey: parseFloat(name) || 0
      }))
      .sort((a, b) => a.sortKey - b.sortKey);

  return {
    analogData: normalize(binsAnalog),
    cyfrData: normalize(binsCyfr)
  };
}


export function ChartResolution({ features, stats, isTileMode, onCategoryClick, selectedCategory }) {
  const [analogData, setAnalogData] = useState([]);
  const [cyfrData, setCyfrData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [cyfrCategory, setCyfrCategory] = useState(null);
  const [analogCategory, setAnalogCategory] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const { analogData, cyfrData } = groupResolution(features, isTileMode ? stats : null);
      setAnalogData(analogData);
      setCyfrData(cyfrData);
    }, 300);

    return () => clearTimeout(timeout);
  }, [features, stats, isTileMode]);

  useEffect(() => {
    if (selectedCategory && !stats) {
      const index = cyfrData.findIndex(item => item.name === selectedCategory);
      setActiveIndex(index >= 0 ? index : null);
    } else {
      setActiveIndex(null);
      setCyfrCategory(null);
      setAnalogCategory(null);
    }
  }, [selectedCategory, cyfrData, stats]);

  const onCyfrClick = ev => {
    if (stats) return;
    const name = ev?.activePayload?.[0]?.payload?.name;
    if (!name) return;
    const next = cyfrCategory === name ? null : name;
    setCyfrCategory(next);
    setAnalogCategory(null);
    onCategoryClick?.(next);
  };

  const onAnalogClick = ev => {
    if (stats) return;
    const name = ev?.activePayload?.[0]?.payload?.name;
    if (!name) return;
    const next = analogCategory === name ? null : name;
    setAnalogCategory(next);
    setCyfrCategory(null);
    onCategoryClick?.(next);
  };

  const cyfStats = calculateStats(cyfrData);
  const analogStats = calculateStats(analogData);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Zdjęcia według charakterystyki przestrzennej</h3>
      </div>
      <div className="chart-content">
        <div className="chart-resolution-grid">
        {/* --- CYFROWE --- */}
        <div className="chart-box">
          {cyfrData.length === 0 ? (
            <p className = "no-data-text">Brak cyfrowych zdjęć dla bieżących filtrów.</p>
          ) : (
            <>
              <div className="chart-header">
                <h5>Cyfrowe - GSD [m]</h5>
                {cyfStats.mostCommon && cyfStats.average && (
                  <div className="resolution-stats">
                    <p>Mode: <span>{`${cyfStats.mostCommon} m`}</span></p>
                    <p>Avg: <span>{`${cyfStats.average} m`}</span></p>
                  </div>
                )}
              </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cyfrData} onClick={onCyfrClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={35} fontSize={13} />
                <YAxis fontSize={13} />
                <Tooltip content={<CustomTooltip chartType="cyf" />} />
                <Bar dataKey="count" fill={rgba(colorPalette[8])} radius={[2, 2, 0, 0]} cursor={stats ? "default" : "pointer"}/>
              </BarChart>
            </ResponsiveContainer>
            </>
          )}
        </div>
        {/* --- ANALOGOWE --- */}
        <div className="chart-box">
          {analogData.length === 0 ? (
            <p className = "no-data-text">Brak analogowych zdjęć dla bieżących filtrów.</p>
          ) : (
            <>
            <div className="chart-header">
                <h5>Analogowe - skala zdjęcia</h5>
                {analogStats.mostCommon && analogStats.average && (
                <div className="resolution-stats">
                    <p>Mode: <span>{analogStats.mostCommon}</span></p>
                    <p>Avg: <span>{Number(analogStats.average).toFixed(0)}</span></p>
                </div>
                )}
            </div>
          <ResponsiveContainer width="100%" height="100%" >
            <BarChart data={analogData} onClick={onAnalogClick} >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={13}/>
              <YAxis fontSize={13}/>
              <Tooltip content={<CustomTooltip chartType="analog" />} />
              <Bar dataKey="count" fill={rgba(colorPalette[1])} radius={[2, 2, 0, 0]} cursor={stats ? "default" : "pointer"}/>
            </BarChart>
          </ResponsiveContainer>
          </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}