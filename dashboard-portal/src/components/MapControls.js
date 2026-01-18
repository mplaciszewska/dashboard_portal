import React from 'react';
import { useState } from 'react';
import "./MapControls.css";
import Button from '@mui/material/Button';


export const LegendControl = ({ yearGroups }) => {
    const [showLegend, setShowLegend] = useState(false);
    return (
        <div>
        {!showLegend ? (
            <button className="legend-button" onClick={() => setShowLegend(true)}>
            <img className="legend-icon" src="/images/legend1.png" alt="Legenda" />
            </button>
        ) : (
            <div className="legend-container">
            <div className="button-div">
                <button className="button-close-legend" onClick={() => setShowLegend(false)}>
                <img className="button-close-icon" src="/images/close.png" alt="Zamknij"></img>
                </button>
            </div>
            {yearGroups.map((group, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                <div
                    style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: `rgb(${group.color[0]},${group.color[1]},${group.color[2]})`,
                    marginRight: '6px',
                    border: 'none',
                    borderRadius: '50%'
                    }}
                />
                <span>
                    {group.label}
                </span>
                </div>
            ))}
            </div>
        )}
      </div>
    );
}


export const DrawControls = ({ drawPolygon, drawRectangle, deletePolygon, exportPolygon, hasPolygon }) => {
    return (
        <div style={{ position: 'absolute', top: 10, left: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button className="button-icon" onClick={drawPolygon}>
                <img className="button-icon-img" src="/images/polygon.png" alt="Draw Polygon"></img>
            </button>
            <button className="button-icon" onClick={drawRectangle}>
                <img className="button-icon-img" src="/images/rectangle.png" alt="Draw Rectangle"></img>
            </button>
            <button 
                className="button-icon" 
                onClick={deletePolygon}
                disabled={!hasPolygon}
                style={{ opacity: hasPolygon ? 1 : 0.3, cursor: hasPolygon ? 'pointer' : 'not-allowed' }}
            >
                <img className="button-icon-img" src="/images/trash-can.png" alt="Delete Shape"></img>
            </button>
            <button 
                className="button-icon" 
                onClick={exportPolygon}
                disabled={!hasPolygon}
                style={{ opacity: hasPolygon ? 1 : 0.3, cursor: hasPolygon ? 'pointer' : 'not-allowed' }}
                title="Eksportuj polygon do GeoJSON"
            >
                <img className="button-icon-img" src="/images/download.png" alt="Export Polygon"></img>
            </button>
        </div>
    )
}

export const PopupWindow = ({ popup, popupRef }) => {
    if (!popup) return null;
    return (
          <div
            className="popup-container"
            ref={popupRef}
            style={{
              left: popup.x,
              top: popup.y,
            }}
          >
            {popup.features && popup.features.length > 0 ? (
              <table className='popup-table'>
                <tbody>
                  {popup.features.map((feat, idx) => (
                    <React.Fragment key={idx}>
                      {popup.features.length > 1 && (
                        <tr><td colSpan={2} style={{textAlign: 'center', fontWeight: 'bold'}}>{idx+1}</td></tr>
                      )}
                      <tr>
                        <th className='popup-label'>Rok wykonania:</th>
                        <td className='popup-value'>{feat.rok_wykonania || 'Brak danych'}</td>
                      </tr>
                      <tr>
                        <th className='popup-label'>Charakterystyka  <br/>przestrzenna:</th>
                        <td className='popup-value'>{feat.rozdzielczosc || 'Brak danych'}</td>
                      </tr>
                      <tr>
                        <th className='popup-label'>Kolor:</th>
                        <td className='popup-value'>{feat.kolor || 'Brak danych'}</td>
                      </tr>
                      <tr>
                        <th className='popup-label'>Typ zdjęcia:</th>
                        <td className='popup-value'>{feat.typ_zdjecia || 'Brak danych'}</td>
                      </tr>
                      <tr>
                        <th className='popup-label'>Nr zgłoszenia:</th>
                        <td className='popup-value'>{feat.nr_zgloszenia || 'Brak danych'}</td>
                      </tr>
                      {feat.url ? (
                        <tr>
                          <td colSpan={2}>
                            <div className="popup-content">
                              <img src={feat.url} className='popup-image' alt="Podgląd zdjęcia"/>
                              <Button
                                variant="outlined"
                                className='popup-button'
                                startIcon={<img src="/images/download.png" alt="download" style={{ width: 18, height: 18 }} />}
                                component="a"
                                href={feat.url}
                                download
                              >
                                Pobierz miniaturę
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={2}><p className="popup-text">Brak zdjęcia do podglądu</p></td>
                        </tr>
                      )}
                      
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="popup-text">Brak danych o obiekcie</p>
            )}
          </div>
    );
}


