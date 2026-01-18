import React, { useMemo, useEffect } from 'react';
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

export function ReportNumberTable({ features, stats, selectedCategory, onCategoryClick }) {
  const [activeIndex, setActiveIndex] = React.useState(null);

  const grouped = useMemo(() => {
    const data = groupByZgloszenie(features, stats);
    return data.sort((a, b) => b.count - a.count);
  }, [features, stats]);

  useEffect(() => {
    if (selectedCategory && !stats) {
      const index = grouped.findIndex(item => item.numer === selectedCategory);
      setActiveIndex(index >= 0 ? index : null);
    } else {
      setActiveIndex(null);
    }
  }, [selectedCategory, grouped, stats]);

  const handleClick = (numer, index) => {
    if (!stats) {
      if (activeIndex === index) {
        setActiveIndex(null);
        onCategoryClick?.(null);
      } else {
        setActiveIndex(index);
        onCategoryClick?.(numer);
      }
    }
  };
  
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
            {grouped.map(({ numer, count }, index) => (
              <tr
              key={numer}
              onClick={() => handleClick(numer, index)}
              style={ stats ? {} : {
                cursor: 'pointer',
                backgroundColor: activeIndex === index ? 'rgba(128, 0, 32, 0.3)': 'transparent',
              }}>
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
