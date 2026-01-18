export const handleDownloadPDF = async (filteredFeatures, polygonArea, regionGeometry, metadata) => {
  const areaName = regionGeometry?.features?.[0]?.properties?.nazwa || "Narysowana figura";

  console.log("Generowanie raportu PDF dla obszaru:", areaName);

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
      data_nalotu: f.properties.data_nalotu ?? null
    }
  }));

  const res = await fetch("http://localhost:8000/api/report/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      count: filteredFeatures.length,
      area: polygonArea,
      area_name: areaName,
      last_update: metadata?.last_update,
      features: featuresPayload
    }),
  });

  if (!res.ok) {
    alert("Błąd podczas generowania raportu");
    console.error("Błąd:", await res.text());
    return;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "raport.pdf";
  a.click();
  window.URL.revokeObjectURL(url);
};
