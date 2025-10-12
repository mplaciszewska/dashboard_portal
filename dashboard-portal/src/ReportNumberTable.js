import React, { useMemo } from 'react';
import './Chart.css';
import './Table.css';


function groupByZgloszenie(features, stats) {
  const map = new Map();

  if (stats && stats.report_numbers) {
    Object.entries(stats.report_numbers).forEach(([numer, count]) => {
      map.set(numer, count);
    });
  } else if (features && Array.isArray(features)) {
    features.forEach((feature) => {
      const nr = feature.properties?.numer_zgloszenia;
      if (!nr) return;

      if (map.has(nr)) {
        map.set(nr, map.get(nr) + 1);
      } else {
        map.set(nr, 1);
      }
    });
  }

  return Array.from(map.entries()).map(([numer, count]) => ({ numer, count }));
}

export function ReportNumberTable({ features, stats }) {
  const grouped = useMemo(() => {
    const data = groupByZgloszenie(features, stats);
    return data.sort((a, b) => b.count - a.count);
  }, [features, stats]);

  // if (!grouped || grouped.length === 0) {
  //   return <p className="no-data-text">Brak zdjęć w zaznaczonym obszarze.</p>;
  // }

  return (
    <div className="chart-container chart-table">
    <div className="chart-header chart-table-header">
      <h3>Zdjęcia według numeru zgłoszenia</h3>
    </div>
    <div className="chart-content">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Numer zgłoszenia</th>
              <th>Liczba zdjęć</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ numer, count }) => (
              <tr key={numer}>
                <td>{numer}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}
