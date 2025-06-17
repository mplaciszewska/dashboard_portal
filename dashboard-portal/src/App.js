import React, { useState, useMemo, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import SummaryComponent from './SummaryComponent';
import { useFetchPointsData } from './hooks/useFetchPointsData';
import { useFilterFeaturesByPolygon } from './hooks/useFilterFeaturesByPolygon';
import './App.css';
import area from '@turf/area';
import {ChartYear} from './ChartYear';
import {ChartResolution} from './ChartResolution';
import {ChartColor} from './ChartColor';
import { ChartPhotoType } from './ChartPhotoType';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'

function App() {
  const [polygon, setPolygon] = useState(null);
  const {features, loading} = useFetchPointsData({ limit: 500000, polygon });
  const [yearRange, setYearRange] = useState([1950, 2025]);
  const hasUserChangedRange = useRef(false);

  const handleYearRangeChange = (newRange) => {
    hasUserChangedRange.current = true;
    setYearRange(newRange);
  };

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const year = f.properties.rok_wykonania;
      return year >= yearRange[0] && year <= yearRange[1];
    });
  }, [features, yearRange]);

  const [minYear, maxYear] = useMemo(() => {
    if (!features.length) return [1950, 2025];

    return features.reduce(
      ([min, max], f) => {
        const y = f.properties?.rok_wykonania;
        if (typeof y === 'number' && !isNaN(y)) {
          return [Math.min(min, y), Math.max(max, y)];
        }
        return [min, max];
      },
      [Infinity, -Infinity]
    );
  }, [features]);

  useEffect(() => {
    if (!features.length || hasUserChangedRange.current) return;

    if (yearRange[0] !== minYear || yearRange[1] !== maxYear) {
      setYearRange([minYear, maxYear]);
    }
  }, [minYear, maxYear, features]);

  const polygonArea = useMemo(() => {
    return polygon ? area(polygon) / 1_000_000 : 313_933;
  }, [polygon]);
  
  const featuresPerKm2 = useMemo(() => {
    return polygonArea > 0 ? filteredFeatures.length / polygonArea : 0;
  }, [filteredFeatures, polygonArea]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Portal</h1>
      </header>
      <div className="main-content">
        <div style={{ display: 'flex', flex: 1, minHeight: 0, maxHeight: '400px', margin:'0' }}>
          <div style={{ height: '400px', flex: "30%", position: 'relative'}}>
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
            <MapComponent
              features={features}
              filteredFeatures={filteredFeatures}
              yearRange={yearRange}
              setYearRange={handleYearRangeChange}
              minYear={minYear}
              maxYear={maxYear}
              onPolygonChange={setPolygon}
            />
          </div>
          <div style={{ flex: "40%", minHeight: 0, margin: '0 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
            <SummaryComponent 
              count={filteredFeatures.length}
              polygonArea={polygonArea}
              featuresPerKm2={featuresPerKm2}
            />
            </div >
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: "50%", minHeight: 0 }}>
                <ChartColor features={filteredFeatures} />
              </div>
              <div style={{ flex: "50%", minHeight: 0 }}>
                <ChartPhotoType features={filteredFeatures} />
              </div>
            </div>
          </div>
          <div style={{ flex: "30%", minHeight: 0 }}>
            <ChartResolution features ={filteredFeatures} />
          </div>
        </div>
        <div style={{ width:'716px'}}>
          <ChartYear features={filteredFeatures} />
        </div>
      </div>

    </div>
  );
}

export default App;
