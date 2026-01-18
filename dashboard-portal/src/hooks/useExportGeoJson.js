export const handleExportGeoJson = async (filteredFeatures, polygonArea, regionGeometry) => {
  console.log("Eksport GeoJSON dla obszaru:", polygonArea?.name || "nieznany");

  if (!filteredFeatures || filteredFeatures.length === 0) {
    alert("Brak danych do eksportu.");
    return;
  }

  const exportLimit = 100_000;

  if (filteredFeatures.length > exportLimit) {
    alert(`Eksport GeoJSON dla więcej niż ${exportLimit.toLocaleString()} zdjęć nie jest obsługiwany.`);
    return;
  }

  const featuresPayload = filteredFeatures.map(f => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      id: f.properties.id,
      rok_wykonania: f.properties.rok_wykonania,
      kolor: f.properties.kolor,
      charakterystyka_przestrzenna: f.properties.charakterystyka_przestrzenna ?? null,
      zrodlo_danych: f.properties.zrodlo_danych ?? null,
      url_do_pobrania: f.properties.url_do_pobrania ?? null,
      numer_zgloszenia: f.properties.numer_zgloszenia ?? null,
      dt_pzgik: f.properties.dt_pzgik ?? null,
      data_nalotu: f.properties.data_nalotu ?? null,
    },
  }));

  try {
    const res = await fetch("http://localhost:8000/api/report/geojson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features: featuresPayload }),
    });

    if (!res.ok) {
      throw new Error(`Błąd serwera: ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `export_${polygonArea?.name || "obszar"}.geojson`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Błąd eksportu GeoJSON:", error);
    alert("Nie udało się wyeksportować danych do GeoJSON.");
  }
};
