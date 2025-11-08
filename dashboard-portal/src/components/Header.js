import React from 'react';
import { colors } from "../theme/colors";

function Header({ isTileMode, loading, onDownloadPDF, onExportCSV }) {
  const isDisabled = isTileMode || loading;
  
  return (
    <header className="App-header">
      <h1>
        Dashboard Portal{' '}
        <span style={{ fontWeight: 'normal', fontSize: '18px' }}>
          - Analiza zdjęć lotniczych w PZGiK
        </span>
      </h1>
      <div className="header-buttons">
        <button
          className="export-button"
          style={{
            backgroundColor: colors.secondaryOpaque,
            opacity: isDisabled ? 0.3 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
          onClick={onDownloadPDF}
          disabled={isDisabled}
        >
          Pobierz raport PDF
        </button>
        <button
          className="export-button"
          style={{
            backgroundColor: colors.secondaryOpaque,
            opacity: isDisabled ? 0.3 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            pointerEvents: isDisabled ? 'none' : 'auto',
          }}
          onClick={onExportCSV}
          disabled={isDisabled}
        >
          Eksport do CSV
        </button>
      </div>
    </header>
  );
}

export default Header;
