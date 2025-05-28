import React from 'react';
import './SummaryComponent.css';

function SummaryComponent({ count, polygonArea, featuresPerKm2 }) {
  return (
    <div className="summary-container">
      <h4>Podsumowanie:</h4>
      <div className="summary-elements">
        <div className="summary-element">
          {count}
          <p>zdjęć</p>
        </div> 
        <div className="summary-element">
          {polygonArea.toFixed(2)}
          <p>km²</p>   
        </div>
        <div className="summary-element">
          {featuresPerKm2.toFixed(0)}
          <p>zdjęć/km²</p>
        </div>
      </div>
    </div>
  );
}

export default SummaryComponent;
