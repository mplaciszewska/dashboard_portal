var map = L.map('map', {
    maxZoom: 18,
    preferCanvas: true
}).setView([52.237049, 21.017532], 7);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
    draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);

    if (layer instanceof L.Polygon) {
        const coords = layer.getLatLngs();
        console.log("Nowy poligon:", coords);
    }
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const geojsonFiles = [
    "gugik_SkorowidzZdjecLotniczych1971-1975.geojson",
    "gugik_SkorowidzZdjecLotniczych1986-1990.geojson",
    "gugik_SkorowidzZdjecLotniczych1991-1995.geojson",
    "gugik_SkorowidzZdjecLotniczych1996-2000.geojson",
    "gugik_SkorowidzZdjecLotniczych2001-2005.geojson",
    "gugik_SkorowidzZdjecLotniczych2006-2010_0.geojson",
    "gugik_SkorowidzZdjecLotniczych2011-2015_0.geojson",
    "gugik_SkorowidzZdjecLotniczych2016-2020_0.geojson",
];

function loadGeojsonAndAddToMap(file) {
    fetch(`data/${file}`)
        .then(res => res.json())
        .then(data => {
            const convertedFeatures = data.features
                .map(feature => {
                    if (feature.geometry && feature.geometry.type === "Point") {
                        const coords2180 = feature.geometry.coordinates;
        
                        return L.circleMarker([coords2180[1], coords2180[0]], {
                            radius: 5,
                            color: 'darkred',
                            fillColor: 'darkred',
                            fillOpacity: 0.7,
                        });
                    }
                    return null;
                })
                .filter(Boolean);

                const markers = L.markerClusterGroup({
                    chunkedLoading: true,
                    disableClusteringAtZoom: 11,
                    iconCreateFunction: function (cluster) {
                        const count = cluster.getChildCount();
                        let size = 'small';
                
                        if (count < 10) {
                            size = 'small';
                        } else if (count < 50) {
                            size = 'medium';
                        } else {
                            size = 'large';
                        }
                
                        return L.divIcon({
                            html: `<div><span>${count}</span></div>`,
                            className: `custom-cluster custom-cluster-${size}`,
                            iconSize: L.point(40, 40)
                        });
                    }
                });
                
            convertedFeatures.forEach(marker => markers.addLayer(marker));
            map.addLayer(markers);
        })
        .catch(err => console.error(`Błąd wczytywania ${file}:`, err));
}

geojsonFiles.forEach(file => loadGeojsonAndAddToMap(file));
