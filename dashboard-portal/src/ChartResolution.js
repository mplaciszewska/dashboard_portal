import React, { useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from 'recharts';
import './Chart.css';
import './ChartResolution.css';
import { tooltipStyle } from './theme/tooltip';
import { colorPalette, rgba } from './theme/colors';


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const group = payload[0].payload.name;
    let displayGroup = group;
    if (payload[0].payload && payload[0].payload.name) {
      if (group && String(group).length > 3) {
        displayGroup = `1 : ${group} - `;
      } else {
        displayGroup = `${group} cm:`;
      }
    }
    return (
      <div style={tooltipStyle}>
        <strong>{displayGroup}</strong> {payload[0].value}<br />
      </div>
    );
  }
  return null;
};

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
        if (!isAnalog && !isNaN(numeric)) {
          numeric = Math.round(numeric * 100);
        }
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
      resolution = Math.round(resolution * 100);
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


export function ChartResolution({ features, stats, isTileMode }) {
  const [analogData, setAnalogData] = useState([]);
  const [cyfrData, setCyfrData] = useState([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const { analogData, cyfrData } = groupResolution(features, isTileMode ? stats : null);
      setAnalogData(analogData);
      setCyfrData(cyfrData);
    }, 300);

    return () => clearTimeout(timeout);
  }, [features, stats, isTileMode]);


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
                <h5>Cyfrowe - GSD [cm]</h5>
                {cyfStats.mostCommon && cyfStats.average && (
                  <div className="resolution-stats">
                    <p>Mode: <span>{`${cyfStats.mostCommon} cm`}</span></p>
                    <p>Avg: <span>{`${cyfStats.average} cm`}</span></p>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height="100%" >
                <BarChart data={cyfrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={35} fontSize={13} />
                  <YAxis fontSize={13}/>
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="count" fill={rgba(colorPalette[8])} radius={[2, 2, 0, 0]}/>
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
            <BarChart data={analogData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={13}/>
              <YAxis fontSize={13}/>
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="count" fill={rgba(colorPalette[1])} radius={[2, 2, 0, 0]}/>
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