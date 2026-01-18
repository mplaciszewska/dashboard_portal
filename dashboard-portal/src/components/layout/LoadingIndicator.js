import React from 'react';
import { Ring } from 'ldrs/react';
import 'ldrs/react/Ring.css';

/**
 * Loading indicator component with customizable text
 * @param {string} text - Text to display
 * @param {string} position - CSS position style (default: absolute)
 * @param {Object} style - Additional inline styles
 */
function LoadingIndicator({ text = "Ładowanie danych", position = "absolute", style = {} }) {
  return (
    <div 
      className="loading-data-container"
      style={{ position, ...style }}
    >
      <p className="loading-text">{text}</p>
      <Ring
        className="loading-ring"
        size="20"
        stroke="3"
        bgOpacity="0"
        speed="2"
        color="#333"
      />
    </div>
  );
}

export default LoadingIndicator;
