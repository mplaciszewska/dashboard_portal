import React, { useMemo, useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from 'recharts';
import './ChartResolution.css';

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

function groupResolution(features) {
    if (!Array.isArray(features)) return [];

    const binsAnalog = {};
    const binsCyfr = {};
    
    features.forEach(feature => {
        let type = feature.properties?.zrodlo_danych;
        if (type == "Zdj. cyfrowe") {
            let resolution = feature.properties?.charakterystyka_przestrzenna;
            resolution = Math.round(resolution * 100);             
            binsCyfr[resolution] = (binsCyfr[resolution] || 0) + 1;
        } else if(type == "Zdj. analogowe") {
            let resolution = feature.properties?.charakterystyka_przestrzenna;
            const numeric = typeof resolution === 'string'
                ? parseFloat(resolution.replace(/[^0-9.]/g, ''))
                : resolution;

            if (isNaN(numeric)) return;

            const rounded = Math.floor(numeric / 100) * 100;

            binsAnalog[rounded] = (binsAnalog[rounded] || 0) + 1;
        }
    })

    const normalize = bins =>
        Object.entries(bins)
        .map(([key, count]) => ({
            name: key,
            count: count,
            sortKey: parseFloat(key.replace(/[^0-9.]/g, '')) || 0
        }))
        .sort((a, b) => a.sortKey - b.sortKey);

    return {
        analogData: normalize(binsAnalog),
        cyfrData  : normalize(binsCyfr)
    };
}

export function ChartResolution({features}) {
  const [analogData, setAnalogData] = useState([]);
  const [cyfrData, setCyfrData] = useState([]);
  
  useEffect(() => {
      if (!Array.isArray(features) || features.length === 0) {
          setAnalogData([]);
          setCyfrData([]);
          return;
      }
  
      const timeout = setTimeout(() => {
          const { analogData, cyfrData } = groupResolution(features);
          setAnalogData(analogData);
          setCyfrData(cyfrData);
      }, 300); // debounce 300ms
  
      return () => clearTimeout(timeout);
  }, [features]);


  const cyfStats = calculateStats(cyfrData);
  const analogStats = calculateStats(analogData);

  return (
    <div className="chart-resolution-container">
      <h4>Zdjęcia według charakterystyki przestrzennej</h4>

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
                  <Tooltip />
                  <Bar dataKey="count" fill="#23687B" />
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
              <Tooltip />
              <Bar dataKey="count" fill="#A16928" />
            </BarChart>
          </ResponsiveContainer>
          </>
          )}
        </div>
      </div>
    </div>
  );
}