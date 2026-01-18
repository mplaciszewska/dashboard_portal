export const exportPolygonGeoJson = (polygonGeometry) => {
  if (!polygonGeometry) {
    alert("Brak narysowanego polygonu do eksportu.");
    return;
  }

  const geojson = {
    type: "Feature",
    geometry: polygonGeometry,
    properties: {
      name: "Drawn Polygon",
      description: "Polygon drawn in the map",
      created: new Date().toISOString()
    }
  };

  const dataStr = JSON.stringify(geojson, null, 2);
  const blob = new Blob([dataStr], { type: "application/geo+json" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.setAttribute("download", `polygon_${timestamp}.geojson`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
