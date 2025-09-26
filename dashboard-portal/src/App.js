import React, { useState, useMemo, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import SummaryComponent from './SummaryComponent';
import { useFetchPointsData } from './hooks/useFetchPointsData';
import './App.css';
import area from '@turf/area';
import { ChartYear } from './ChartYear';
import { ChartResolution } from './ChartResolution';
import { ChartColor } from './ChartColor';
import { ChartPhotoType } from './ChartPhotoType';
import { ReportNumberTable } from './ReportNumberTable';
import { Ring } from 'ldrs/react';
import TerytSelection from './TerytSelection';
import 'ldrs/react/Ring.css';
import { useRegionGeometry } from './hooks/useRegionGeometry';
import { handleDownloadPDF } from './hooks/useGenerateReportPdf';

import { colorPalette, rgba } from "./theme/colors";

export function generateYearGroups(minYear, maxYear) {
  const groupCount = colorPalette.length;
  const range = maxYear - minYear + 1;
  const step = Math.ceil(range / groupCount);

  return colorPalette.map((c, i) => {
    const start = minYear + i * step;
    const end = Math.min(minYear + (i + 1) * step - 1, maxYear);
    return {
      range: [start, end],
      label: `${start}-${end}`,
      color: c,
    };
  });
}

function App() {
  const [polygon, setPolygon] = useState(null);
  const { features, loading } = useFetchPointsData({ limit: 500000, polygon });
  const [yearRange, setYearRange] = useState([1950, 2025]);
  const hasUserChangedRange = useRef(false);
  const [region, setRegion] = useState({ level: null, kod: null });
  const [isTileMode, setIsTileMode] = useState(true);
  const [stats, setStats] = useState(null);
  const [yearGroups, setYearGroups] = useState(null);

  const handleYearRangeChange = (newRange) => {
    hasUserChangedRange.current = true;
    setYearRange(newRange);
  };

  useEffect(() => {
    fetch('http://localhost:8000/tiling/tiles12/stats.json')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        const yearsArray = data.years ? Object.keys(data.years).map(y => parseInt(y)) : [];
        const years = yearsArray.filter(y => !isNaN(y));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        setYearGroups(generateYearGroups(minYear, maxYear));
      })
      .catch(err => console.error('Błąd wczytywania stats.json', err));
  }, []);

  const [minYear, maxYear, filteredFeatures] = useMemo(() => {
    if (!features.length) return [1950, 2025, []];

    let min = Infinity;
    let max = -Infinity;
    const filtered = features.filter(f => {
      const y = f.properties?.rok_wykonania;
      if (typeof y === 'number') {
        if (y < min) min = y;
        if (y > max) max = y;
        return y >= yearRange[0] && y <= yearRange[1];
      }
      return false;
    });

    return [min, max, filtered];
  }, [features, yearRange]);


  const polygonArea = useMemo(() => {
    return polygon ? area(polygon) / 1_000_000 : 313_933;
  }, [polygon]);

  const featuresPerKm2 = useMemo(() => {
    return polygonArea > 0 ? filteredFeatures.length / polygonArea : 0;
  }, [filteredFeatures, polygonArea]);

  const regionGeometry = useRegionGeometry(region.level, region.kod, region.nazwa);
  
  return (
    <div className="App">
      <header className="App-header">
        <div>
          
        </div>
        <h1>Dashboard Portal</h1>
        <button onClick={() => handleDownloadPDF(filteredFeatures, polygonArea, regionGeometry)}>Pobierz raport PDF</button>
      </header>
      <div className="main-content">
        <div
          style={{
            display: 'flex',
            flexGrow: 6.5,
            flexShrink: 1,
            flexBasis: 0,
            minHeight: 0,
            margin: 0,
            width: '100%',
            gap: '10px',
          }}
        >
          <div style={{
            flexGrow: 3,
            flexShrink: 1,
            flexBasis: 0,
            position: 'relative', minHeight: 0 }}>
            {loading ? (
              <div className="loading-data-container">
                <p className="loading-text">Ładowanie danych</p>
                <Ring
                  className="loading-ring"
                  size="20"
                  stroke="3"
                  bgOpacity="0"
                  speed="2"
                  color="#333"
                />
              </div>
            ) : null}
            <div style={{ width: '100%', height: '100%' }}>
              <MapComponent
                filteredFeatures={filteredFeatures}
                yearRange={yearRange}
                setYearRange={handleYearRangeChange}
                minYear={minYear}
                maxYear={maxYear}
                onPolygonChange={setPolygon}
                regionGeometry={regionGeometry}
                isTileMode={isTileMode}
                setIsTileMode={setIsTileMode}
                yearGroups={yearGroups || []}
              />
            </div>
            <TerytSelection
              onConfirm={(level, kod) => setRegion({ level, kod })}
              style={{
                position: 'absolute',
                top: '75px',
                left: '9px',
                zIndex: 1000,
                borderRadius: '4px',
              }}
            />
          </div>

          <div
            style={{
              flexGrow: 4,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%',
              minWidth: 0,
            }}
          >
            <SummaryComponent
              count={filteredFeatures.length}
              polygonArea={polygonArea}
              featuresPerKm2={featuresPerKm2}
              region={regionGeometry}
              stats={isTileMode ? stats : null}
            />
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'row',
                gap: '10px',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <ChartColor 
                  features={filteredFeatures} 
                  stats={isTileMode ? stats : null}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <ChartPhotoType 
                  features={filteredFeatures}
                  stats={isTileMode ? stats : null}
                  />
              </div>
            </div>
          </div>

          <div
            style={{
              flexGrow: 3,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <ChartResolution 
            features={filteredFeatures}
            stats={isTileMode ? stats : null}
            isTileMode={isTileMode}
             />
          </div>
        </div>
        <div
          style={{
            flexGrow: 3.5,
            flexShrink: 1,
            flexBasis: 0,
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            height: '100%',
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <ChartYear 
            features={filteredFeatures}
            stats={isTileMode ? stats : null}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <ReportNumberTable 
            features={filteredFeatures}
            stats={isTileMode ? stats : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
