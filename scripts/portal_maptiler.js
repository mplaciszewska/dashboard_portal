var map = L.map('map', {
    maxZoom: 18
}).setView([52.237049, 21.017532], 7);

const mtLayer = L.maptiler.maptilerLayer({
    apiKey: '<key>',
    style: L.maptiler.MapStyle.DATAVIZ
}).addTo(map);

proj4.defs("EPSG:2180", "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs");

const geojsonFiles = [
    "gugik_SkorowidzZdjecLotniczych1986-1990.geojson",
    "gugik_SkorowidzZdjecLotniczych1991-1995.geojson"
];

function loadGeojsonAndAddToMap(file, useClustering = true) {
    fetch(`data/${file}`)
        .then(res => res.json())
        .then(data => {
            const convertedFeatures = data.features
                .map(feature => {
                    if (feature.geometry && feature.geometry.type === "Point") {
                        const coords2180 = feature.geometry.coordinates;
                        const coordsWGS84 = proj4("EPSG:2180", "WGS84", coords2180);
                        return {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: coordsWGS84
                            },
                            properties: {
                                ...feature.properties
                            }
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            if (useClustering) {
                const markers = L.markerClusterGroup();

                convertedFeatures.forEach(feature => {
                    const [lng, lat] = feature.geometry.coordinates;
                    const marker = L.circleMarker([lat, lng], {
                        radius: 5,
                        color: 'darkred',
                        fillColor: 'darkred',
                        fillOpacity: 0.7
                    });
                    markers.addLayer(marker);
                });
                map.addLayer(markers);
            } else {
                const fullGeoJSON = {
                    type: "FeatureCollection",
                    features: convertedFeatures
                };

                mtLayer.addPoint({
                    data: fullGeoJSON,
                    pointColor: "darkred",
                    pointOpacity: 0.7,
                    minPointRadius: 6,
                    maxPointRadius: 10
                });
            }
        })
        .catch(err => console.error(`Błąd wczytywania ${file}:`, err));
}

mtLayer.on("ready", () => {
    geojsonFiles.forEach(file => loadGeojsonAndAddToMap(file, false)); 
});
