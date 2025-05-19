import React from 'react';
import MapComponent from './MapComponent';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Portal</h1>
      </header>
      <div className="map-wrapper">
        <MapComponent />
      </div>
    </div>
  );
}

export default App;
