import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import MapComponent from './MapComponent';
import SummaryComponent from './SummaryComponent';
import Header from './Header';
import LoadingIndicator from './layout/LoadingIndicator';
import { useFetchPointsData } from '../hooks/useFetchPointsData';
import './App.css';
import { ChartYear } from '../charts/ChartYear';
import { ChartResolution } from '../charts/ChartResolution';
import { ChartColor } from '../charts/ChartColor';
import { ChartPhotoType } from '../charts/ChartPhotoType';
import { ChartVegetation } from '../charts/ChartVegetation';
import { ChartNew } from '../charts/ChartNew';
import { ReportNumberTable } from '../charts/ReportNumberTable';
import TerytSelection from './TerytSelection';
import { useRegionGeometry } from '../hooks/useRegionGeometry';
import { handleDownloadPDF } from '../hooks/useGenerateReportPdf';
import { handleExportCsv } from '../hooks/useExportCsv';
import { colors } from "../theme/colors";

import { 
  generateYearGroups, 
  isFeatureInCategory,
  filterFeaturesByCategory,
  filterFeaturesByYear,
  getYearRangeFromFeatures
} from '../utils/featureFilters';

import { calculatePolygonArea, extractGeometryFromRegion } from '../utils/geometryHelpers';
import { DEFAULT_YEAR_RANGE, STATS_JSON_URL, FETCH_LIMIT, METADATA_URL } from '../utils/constants';


function App() {
  const [polygon, setPolygon] = useState(null);
  const [region, setRegion] = useState({ level: null, kod: null, area: null });
  const [isTileMode, setIsTileMode] = useState(true);
  const [metadata, setMetadata] = useState(null);
  
  const requestParams = useMemo(
    () => ({ limit: FETCH_LIMIT, polygon }),
    [polygon]
  );

  const { features, loading } = useFetchPointsData(requestParams); 
  const [yearRange, setYearRange] = useState(DEFAULT_YEAR_RANGE);
  const hasUserChangedRange = useRef(false);
  const previousLoadingRef = useRef(false);
  const [stats, setStats] = useState(null);
  const [yearGroups, setYearGroups] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);


  useEffect(() => {
    if (loading && !previousLoadingRef.current) {
      hasUserChangedRange.current = false;
      setYearRange(DEFAULT_YEAR_RANGE);
    }
    previousLoadingRef.current = loading;
  }, [loading]);


  useEffect(() => {
    if (isTileMode) {
      setSelectedCategory(null);
    }
  }, [isTileMode]);


  const handleYearRangeChange = (newRange) => {
    hasUserChangedRange.current = true;
    setYearRange(newRange);
  };


  useEffect(() => {
    fetch(STATS_JSON_URL)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        const yearsArray = data.years ? Object.keys(data.years).map(y => parseInt(y)) : [];
        const years = yearsArray.filter(y => !isNaN(y));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        setYearGroups(generateYearGroups(minYear, maxYear));
      })
      .catch(err => console.error('Błąd wczytywania stats.json', err));
  }, []);

  useEffect(() => {
    fetch(METADATA_URL)
      .then(res => res.json())
      .then(data => {
        setMetadata(data);
        console.log('Metadata loaded:', data);
      })
      .catch(err => console.error('Błąd wczytywania metadanych', err));
  }, []);

  const baseFeatures = useMemo(() => {
    return filterFeaturesByCategory(features, selectedCategory);
  }, [features, selectedCategory]);


  const [absoluteMinYear, absoluteMaxYear] = useMemo(() => {
    return getYearRangeFromFeatures(baseFeatures);
  }, [baseFeatures]);


  const filteredFeatures = useMemo(() => {
    const filtered = filterFeaturesByYear(
      baseFeatures, 
      yearRange, 
      [absoluteMinYear, absoluteMaxYear]
    );
    
    if (filtered.length !== baseFeatures.length) {
      console.log(`Filtered ${baseFeatures.length} → ${filtered.length} features by year range [${yearRange[0]}, ${yearRange[1]}]`);
    }
    
    return filtered;
  }, [baseFeatures, yearRange, absoluteMinYear, absoluteMaxYear]);


  const prevFilteredRef = useRef(null);
  

  useEffect(() => {
    if (prevFilteredRef.current && prevFilteredRef.current !== filteredFeatures) {
      prevFilteredRef.current = null;
    }
    prevFilteredRef.current = filteredFeatures;
  }, [filteredFeatures]);


  useEffect(() => {
    if (hasUserChangedRange.current) return;
    if (!loading && baseFeatures.length > 0) {
      setYearRange([absoluteMinYear, absoluteMaxYear]);
    }
  }, [loading, baseFeatures.length, absoluteMinYear, absoluteMaxYear]);


  const regionGeometry = useRegionGeometry(region.level, region.kod, region.nazwa, region.area);

  const polygonArea = useMemo(() => {
    if (polygon && !regionGeometry) {
      const area = calculatePolygonArea(polygon);
      return area;
    }
    if (polygon && regionGeometry) {
      const regionPoly = extractGeometryFromRegion(regionGeometry);
      if (polygon !== regionPoly && JSON.stringify(polygon) !== JSON.stringify(regionPoly)) {
        const area = calculatePolygonArea(polygon);
        return area;
      }
    }
    if (region.level && region.kod && region.area) {
      return region.area;
    }
    if(!polygon && !regionGeometry){
      return metadata.convex_hull_area_km2;
    }
    const area = calculatePolygonArea(polygon);
    return area;
  }, [polygon, region.level, region.kod, region.area, regionGeometry, metadata]);


  const featuresPerKm2 = useMemo(() => {
    return polygonArea > 0 ? filteredFeatures.length / polygonArea : 0;
  }, [filteredFeatures, polygonArea]);

  const handleDownloadPDFClick = () => {
    if (!isTileMode && !loading) {
      handleDownloadPDF(filteredFeatures, polygonArea, regionGeometry, metadata);
    }
  };


  const handleExportCSVClick = () => {
    if (!isTileMode && !loading) {
      handleExportCsv(filteredFeatures, polygonArea, regionGeometry);
    }
  };

  
  const handleCategoryClick = (chartType, value) => {
    if (loading) return;
    
    if (value === null) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory({ chartType, value });
    }
  };


  return (
    <div className="App">
      <Header 
        isTileMode={isTileMode}
        loading={loading}
        onDownloadPDF={handleDownloadPDFClick}
        onExportCSV={handleExportCSVClick}
      />
      <div className="main-content" style={{ backgroundColor: colors.background }}>
        <div
          style={{
            display: 'flex',
            flexGrow: 6.5,
            flexShrink: 1,
            flexBasis: 0,
            minHeight: 0,
            margin: 0,
            width: '100%',
            gap: '10px',
          }}
        >
          <div style={{
            flexGrow: 3,
            flexShrink: 1,
            flexBasis: 0,
            position: 'relative', minHeight: 0 }}>
            {loading && <LoadingIndicator text="Ładowanie danych" />}
            <div style={{ width: '100%', height: '100%' }}>
              <MapComponent
                filteredFeatures={filteredFeatures}
                yearRange={yearRange}
                setYearRange={handleYearRangeChange}
                minYear={absoluteMinYear}
                maxYear={absoluteMaxYear}
                onPolygonChange={setPolygon}
                regionGeometry={regionGeometry}
                isTileMode={isTileMode}
                setIsTileMode={setIsTileMode}
                yearGroups={yearGroups || []}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                loading={loading}
              />
            </div>
            <TerytSelection
              onConfirm={(level, kod, area) => setRegion({ level, kod, area })}
            />
          </div>

          <div
            style={{
              flexGrow: 4,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              height: '100%',
              minWidth: 0,
            }}
          >
            <SummaryComponent
              count={filteredFeatures.length}
              polygonArea={polygonArea}
              featuresPerKm2={featuresPerKm2}
              region={regionGeometry}
              stats={isTileMode ? stats : null}
            />
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'row',
                gap: '10px',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: 1.2,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <ChartNew
                  features={filteredFeatures} 
                  stats={isTileMode ? stats : null}
                  onCategoryClick={(value) => handleCategoryClick('date', value)}
                  disabled={loading}
                />
              </div>
              <div
                style={{
                  flex: 0.8,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <ChartColor 
                  features={filteredFeatures}
                  stats={isTileMode ? stats : null}
                  onCategoryClick={(value) => handleCategoryClick('color', value)}
                  selectedCategory={selectedCategory?.chartType === 'color' ? selectedCategory.value : null}
                  disabled={loading}
                  />
              </div>
            </div>
          </div>

          <div
            style={{
              flexGrow: 3,
              flexShrink: 1,
              flexBasis: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <ChartResolution 
            features={filteredFeatures}
            stats={isTileMode ? stats : null}
            isTileMode={isTileMode}
            onCategoryClick={(value) => handleCategoryClick('resolution', value)}
            selectedCategory={selectedCategory?.chartType === 'resolution' ? selectedCategory.value : null}
            disabled={loading}
             />
          </div>
        </div>
        <div
          style={{
            flexGrow: 3.5,
            flexShrink: 1,
            flexBasis: 0,
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            height: '100%',
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1.2, minHeight: 0, minWidth: 0 }}>
            <ChartYear 
            features={filteredFeatures}
            stats={isTileMode ? stats : null}
            />
          </div>
          <div style={{ 
            flex: 1.8, 
            minHeight: 0, 
            minWidth: 0,
            display: 'flex',
            flexDirection: 'row',
            gap: '10px'
          }}>
            <div style={{ flex: 1.1, minHeight: 0, minWidth: 0 }}>
              <ChartVegetation
                features={filteredFeatures}
                stats={isTileMode ? stats : null}
                onCategoryClick={(value) => handleCategoryClick('vegetation', value)}
                selectedCategory={selectedCategory?.chartType === 'vegetation' ? selectedCategory.value : null}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 0.9, minHeight: 0, minWidth: 0 }}>
              <ChartPhotoType
                features={filteredFeatures}
                stats={isTileMode ? stats : null}
                onCategoryClick={(value) => handleCategoryClick('photoType', value)}
                selectedCategory={selectedCategory?.chartType === 'photoType' ? selectedCategory.value : null}
                disabled={loading}
              />
            </div>
            <div style={{ 
              width: '340px',
              minHeight: 0,
              flexShrink: 0
            }}>
              <ReportNumberTable 
              features={filteredFeatures}
              stats={isTileMode ? stats : null}
              selectedCategory={selectedCategory?.chartType === 'reportNumber' ? selectedCategory.value : null}
              onCategoryClick={(value) => handleCategoryClick('reportNumber', value)}
              disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
