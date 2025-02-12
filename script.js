// Initialiser la carte
var map = L.map('map', {
    center: [48.11, -1.64],
    zoom: 15,
    attributionControl: true
});

// Ajouter une attribution personnalisée directement via la carte
map.attributionControl.addAttribution('Réalisation : <a href="https://esigat.wordpress.com/" target="_blank"> Master SIGAT / OSM / Rennes Métropole</a>');

// Définition des fonds de carte
var baselayers = {
    "OpenStreetMap": L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png'),
    "ESRI Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
    "Carto Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'),
    "Ortho Rennes Métropole": L.tileLayer.wms('https://public.sig.rennesmetropole.fr/geoserver/ows?', { layers: 'raster:ortho2021' })
};

// Ajouter un fond de carte par défaut
baselayers["OpenStreetMap"].addTo(map);

// Ajout des couches supplémentaires
var Cadastre = L.tileLayer.wms('http://geobretagne.fr/geoserver/cadastre/wms', {
    layers: 'CP.CadastralParcel',
    format: 'image/png',
    transparent: true,
    opacity: 0.5
});
var bati = L.tileLayer.wms('https://public.sig.rennesmetropole.fr/geoserver/ows?', {
    layers: 'ref_cad:batiment',
    format: 'image/png',
    transparent: true
});
var trafic = L.tileLayer.wms('https://public.sig.rennesmetropole.fr/geoserver/ows?', {
    layers: 'trp_rout:v_rva_trafic_fcd',
    format: 'image/png',
    transparent: true
});
var Rennes2 = L.marker([48.119, -1.7013]).bindPopup('<h1>Université Rennes 2</h1>');

// Grouper les couches supplémentaires
var overlays = {
    "Cadastre": Cadastre,
    "Bâtiments": bati,
    "Trafic": trafic,
    "Rennes 2 (Marqueur)": Rennes2
};

// Ajout des Stations de vélos avec marqueurs personnalisés affichant le nombre de vélos
var url = 'https://raw.githubusercontent.com/mastersigat/data/main/velostar.geojson';

// Charger les données GeoJSON
$.getJSON(url, function (geojson) {
    var velos = L.geoJson(geojson, {
        pointToLayer: function (feature, latlng) {
            // Récupérer le nombre de vélos disponibles
            var bikeCount = feature.properties.bikesAvailable || 0;

            // Créer une icône personnalisée avec le nombre de vélos
            var customIcon = L.divIcon({
                className: 'custom-bike-icon', // Classe CSS pour personnalisation
                html: `
                    <div style="
                        text-align: center;
                        font-size: 14px;
                        font-weight: bold;
                        color: white;
                        background: #2196F3;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        line-height: 40px;
                        box-shadow: 0 0 5px rgba(0,0,0,0.5);
                        ">
                        ${bikeCount}
                    </div>
                `,
                iconSize: [40, 40], // Taille de l'icône
                iconAnchor: [20, 20] // Centre de l'icône
            });

            // Retourner le marqueur avec l'icône personnalisée
            return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: function (feature, layer) {
            // Ajouter un popup pour chaque station
            var popupContent = '<h3>Station Vélo</h3>';
            if (feature.properties) {
                if (feature.properties.name) {
                    popupContent += '<p><strong>Nom :</strong> ' + feature.properties.name + '</p>';
                }
                if (feature.properties.address) {
                    popupContent += '<p><strong>Adresse :</strong> ' + feature.properties.address + '</p>';
                }
                if (feature.properties.bikesAvailable) {
                    popupContent += '<p><strong>Vélos disponibles :</strong> ' + feature.properties.bikesAvailable + '</p>';
                }
            }
            layer.bindPopup(popupContent);
        }
    });

    // Ajouter la couche des stations de vélos à la carte
    velos.addTo(map);
});


// Ajouter une échelle
L.control.scale().addTo(map);

// Ajouter une MiniMap
var miniMapLayer = L.tileLayer('https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png');
var miniMap = new L.Control.MiniMap(miniMapLayer, { toggleDisplay: true, minimized: false, position: 'bottomright' }).addTo(map);

// Créer un conteneur pour les fonds de carte avec un titre
var baseLayerControl = L.control({ position: 'topleft' });
baseLayerControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'base-layer-control');
    div.innerHTML = '<h4>Fonds de Carte</h4>';
    div.appendChild(L.DomUtil.create('div', 'leaflet-control-layers-base'));
    return div;
};
baseLayerControl.addTo(map);

// Créer un conteneur pour les couches thématiques avec un titre
var overlayControl = L.control({ position: 'topright' });
overlayControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'overlay-control');
    div.innerHTML = '<h4>Couches Thématiques</h4>';
    div.appendChild(L.DomUtil.create('div', 'leaflet-control-layers-overlays'));
    return div;
};
overlayControl.addTo(map);

// Ajouter les contrôleurs Leaflet dans les conteneurs
L.control.layers(baselayers, {}, { position: 'topleft', collapsed: true }).addTo(map);
L.control.layers({}, overlays, { position: 'topright', collapsed: true }).addTo(map);

// Molette pour ajuster l'opacité
var opacityControl = L.control({ position: 'bottomright' });
opacityControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'opacity-control');
    div.innerHTML = '<label for="opacityRange">Opacité :</label><br><input id="opacityRange" type="range" min="0" max="1" step="0.1" value="0.5">';
    L.DomEvent.disableClickPropagation(div); // Empêche la propagation des événements
    return div;
};
opacityControl.addTo(map);

// Mise à jour de l'opacité via la molette
document.getElementById('opacityRange').addEventListener('input', function (e) {
    var opacity = parseFloat(e.target.value);
    Cadastre.setOpacity(opacity);
    bati.setOpacity(opacity);
    trafic.setOpacity(opacity);
});