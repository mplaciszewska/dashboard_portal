import React, { useMemo } from 'react';
import './ReportNumberTable.css';
function groupByZgloszenie(features) {
  const map = new Map();

  features.forEach((feature) => {
    const nr = feature.properties?.numer_zgloszenia;
    if (!nr) return;

    if (map.has(nr)) {
      map.set(nr, map.get(nr) + 1);
    } else {
      map.set(nr, 1);
    }
  });

  return Array.from(map.entries()).map(([numer, count]) => ({ numer, count }));
}


export function ReportNumberTable({ features }) {
  const grouped = useMemo(() => groupByZgloszenie(features), [features]);

  if (grouped.length === 0) {
    return <p className="no-data-text">Brak zdjęć w zaznaczonym obszarze.</p>;
  }

  return (
    <div className="zgloszenia-table">
      <table>
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
  );
}
