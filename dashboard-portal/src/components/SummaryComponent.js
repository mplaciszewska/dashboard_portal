import React from 'react';
import './SummaryComponent.css';


function SummaryComponent({ count, polygonArea, featuresPerKm2, region, stats }) {

  const summaryCount = stats
    ? Object.values(stats.years).reduce((sum, val) => sum + val, 0)
    : count;
  const summaryFeaturesPerKm2 = stats ? (summaryCount / polygonArea) : featuresPerKm2;

  return (
    <div className="summary-container">
      <h4>Podsumowanie:</h4>
      <div className="summary-elements">
        { region && (
          <div className="summary-element">
            <p>{region.features?.[0]?.properties?.nazwa}</p>
          </div>
        )}
        <div className="summary-element">
          {summaryCount}
          <p>zdjęć</p>
        </div> 
        <div className="summary-element">
          {polygonArea.toFixed(2)}
          <p>km²</p>   
        </div>
        <div className="summary-element">
          {summaryFeaturesPerKm2.toFixed(0)}
          <p>zdjęć/km²</p>
        </div>
      </div>
    </div>
  );
}

export default SummaryComponent;
