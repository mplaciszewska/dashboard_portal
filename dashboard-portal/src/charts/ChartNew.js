import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import sharedSelectStyles from '../theme/dropdown';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';
import './Chart.css';
import './Table.css';
import { colors } from '../theme/colors';

function processLatestData(features, stats) {
  const tableData = [];

  if (stats && stats.dt_pzgik_rok_correlation) {
    Object.entries(stats.dt_pzgik_rok_correlation).forEach(([dt_pzgik, yearData]) => {
      const dataDate = new Date(dt_pzgik);
      Object.entries(yearData).forEach(([rok_wykonania, count]) => {
        tableData.push({
          dt_pzgik: dt_pzgik,
          rok_wykonania: parseInt(rok_wykonania),
          count: count,
          dateObj: dataDate
        });
      });
    });
  } else if (Array.isArray(features)) {
    const dateMap = {};
    features.forEach(feature => {
      const dt_pzgik = feature.properties?.dt_pzgik;
      const rok_wykonania = feature.properties?.rok_wykonania;
      if (dt_pzgik && rok_wykonania) {
        if (!dateMap[dt_pzgik]) {
          dateMap[dt_pzgik] = {};
        }
        if (!dateMap[dt_pzgik][rok_wykonania]) {
          dateMap[dt_pzgik][rok_wykonania] = 0;
        }
        dateMap[dt_pzgik][rok_wykonania]++;
      }
    });
    Object.entries(dateMap).forEach(([dt_pzgik, yearData]) => {
      const dataDate = new Date(dt_pzgik);
      Object.entries(yearData).forEach(([rok_wykonania, count]) => {
        tableData.push({
          dt_pzgik: dt_pzgik,
          rok_wykonania: parseInt(rok_wykonania),
          count: count,
          dateObj: dataDate
        });
      });
    });
  }

  const sortedData = tableData.sort((a, b) => {
    if (a.dateObj.getTime() !== b.dateObj.getTime()) {
      return b.dateObj.getTime() - a.dateObj.getTime();
    }
    return b.rok_wykonania - a.rok_wykonania; 
  });

  return { data: sortedData };
}

export function ChartNew({ features, stats, selectedCategory, onCategoryClick }) {
  const [cacheRows, setCacheRows] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [numRows, setNumRows] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'dt_pzgik', direction: 'desc' });
  const [activeIndex, setActiveIndex] = useState(null);

  const sortedTableData = React.useMemo(() => {
    if (!tableData.length) return [];
    const sorted = [...tableData];
    if (sortConfig.key === 'dt_pzgik') {
      sorted.sort((a, b) => sortConfig.direction === 'asc'
        ? a.dt_pzgik.localeCompare(b.dt_pzgik)
        : b.dt_pzgik.localeCompare(a.dt_pzgik));
    } else if (sortConfig.key === 'rok_wykonania') {
      sorted.sort((a, b) => sortConfig.direction === 'asc'
        ? a.rok_wykonania - b.rok_wykonania
        : b.rok_wykonania - a.rok_wykonania);
    } else if (sortConfig.key === 'count') {
      sorted.sort((a, b) => sortConfig.direction === 'asc'
        ? a.count - b.count
        : b.count - a.count);
    }
    return sorted;
  }, [tableData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'desc' };
      }
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const result = processLatestData(features, stats);
      setCacheRows(result.data.length >= 50 ? result.data.slice(0, 50) : result.data);
    }, 300);
    return () => clearTimeout(timeout);
  }, [features, stats]);

  useEffect(() => {
    setTableData(cacheRows.slice(0, numRows));
  }, [numRows, cacheRows]);


  useEffect(() => {
    if (selectedCategory && !stats) {
      const index = tableData.findIndex(item => item.name === selectedCategory);
      setActiveIndex(index >= 0 ? index : null);
    } else {
      setActiveIndex(null);
    }
  }, [selectedCategory, tableData, stats]);

  const handleClick = (dt_pzgik, index) => {
    if (!stats) {
      if (activeIndex === index) {
        setActiveIndex(null);
        onCategoryClick?.(null);
      } else {
        setActiveIndex(index);
        onCategoryClick?.(dt_pzgik);
      }
    }
  };

  return (
    <div className="chart-container chart-table">
      <div className="chart-header chart-table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Ostatnio dodane paczki zdjęć</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>

          <Select
            id="numRowsSelect"
            value={{ value: numRows, label: numRows.toString() }}
            onChange={option => setNumRows(option.value)}
            options={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 50, label: '50' },
            ]}
            styles={sharedSelectStyles}
            theme={theme => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary25: '#eee',
                primary: colors.secondary,
                neutral20: '#999',
                neutral30: '#666',
                primary50: colors.secondary,
              },
            })}
            isSearchable={false}
          />
        </div>
      </div>
      <div className="chart-content">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                  onClick={() => handleSort('dt_pzgik')}
                >
                  Data dodania
                  <span style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                    {sortConfig.key === 'dt_pzgik'
                      ? <MdOutlineKeyboardArrowDown style={{ color: '#666', fontSize: '20px', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      : <MdOutlineKeyboardArrowDown style={{ color: '#bbb', fontSize: '20px', opacity: 0.5 }} />}
                  </span>
                </th>
                <th
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                  onClick={() => handleSort('rok_wykonania')}
                >
                  Rok
                  <span style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                    {sortConfig.key === 'rok_wykonania'
                      ? <MdOutlineKeyboardArrowDown style={{ color: '#666', fontSize: '20px', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      : <MdOutlineKeyboardArrowDown style={{ color: '#bbb', fontSize: '20px', opacity: 0.5 }} />}
                  </span>
                </th>
                <th
                  className="sortable-header"
                  style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}
                  onClick={() => handleSort('count')}
                >
                  Liczba zdjęć
                  <span style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                    {sortConfig.key === 'count'
                      ? <MdOutlineKeyboardArrowDown style={{ color: '#666', fontSize: '20px', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      : <MdOutlineKeyboardArrowDown style={{ color: '#bbb', fontSize: '20px', opacity: 0.5 }} />}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTableData.map((row, index) => (
                <tr 
                key={`${row.dt_pzgik}-${row.rok_wykonania}`}
                onClick={() => handleClick(row.dt_pzgik, index)}
                style={ stats ? {} : {
                  cursor: 'pointer',
                  backgroundColor: activeIndex === index ? 'rgba(128, 0, 32, 0.3)': 'transparent',
                }}>
                  <td>{row.dt_pzgik}</td>
                  <td>{row.rok_wykonania}</td>
                  <td style={{ color: colors.secondaryOpaque }}>+ <strong>{row.count.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}