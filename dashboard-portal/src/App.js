import React, { useState } from 'react';
import MapComponent from './MapComponent';
import SummaryComponent from './SummaryComponent';
import { useFetchPointsData } from './hooks/useFetchPointsData';
import { useFilterFeaturesByPolygon } from './hooks/useFilterFeaturesByPolygon';
import './App.css';
import area from '@turf/area';
import { YearChart } from './YearChart';
import {Chart2} from './Chart2';
import {Chart3} from './Chart3';
import { Chart4 } from './Chart4';

function App() {
  const features = useFetchPointsData({ limit: 500000 });
  const [polygon, setPolygon] = useState(null);

  const filteredFeatures = useFilterFeaturesByPolygon(features, polygon);

  const polygonArea = (polygon ? area(polygon) / 1_000_000 : 313933);
  const featuresPerKm2 = polygonArea > 0
  ? (filteredFeatures.length / polygonArea): 0;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Portal</h1>
      </header>
      <div className="main-content">
        <div style={{ display: 'flex', flex: 1, minHeight: 0, maxHeight: '400px', margin:'0' }}>
          <div style={{ height: '400px', width: '500px'}}>
            <MapComponent
              features={features}
              filteredFeatures={filteredFeatures}
              onPolygonChange={setPolygon}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, margin: '0 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
            <SummaryComponent 
              count={filteredFeatures.length}
              polygonArea={polygonArea}
              featuresPerKm2={featuresPerKm2}
            />
            </div >
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <Chart3 />
              </div>
              <div >
                <Chart4 />
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Chart2 />
          </div>
        </div>
        <div style={{ width:'716px'}}>
          <YearChart features={filteredFeatures} />
        </div>
      </div>

    </div>
  );
}

export default App;
