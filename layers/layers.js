var wms_layers = [];


        var lyr_GoogleTerrain_0 = new ol.layer.Tile({
            'title': 'Google Terrain',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '<a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
            })
        });
var format_JARDIMMORI_1 = new ol.format.GeoJSON();
var features_JARDIMMORI_1 = format_JARDIMMORI_1.readFeatures(json_JARDIMMORI_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_JARDIMMORI_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_JARDIMMORI_1.addFeatures(features_JARDIMMORI_1);
var lyr_JARDIMMORI_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_JARDIMMORI_1, 
                style: style_JARDIMMORI_1,
                popuplayertitle: 'JARDIM MORIÁ',
                interactive: true,
    title: 'JARDIM MORIÁ<br />\
    <img src="styles/legend/JARDIMMORI_1_0.png" /> DISPONÍVEL<br />\
    <img src="styles/legend/JARDIMMORI_1_1.png" /> VERDE<br />\
    <img src="styles/legend/JARDIMMORI_1_2.png" /> INSTITUCIONAL<br />\
    <img src="styles/legend/JARDIMMORI_1_3.png" /> QUITADO<br />\
    <img src="styles/legend/JARDIMMORI_1_4.png" /> VENDIDOS<br />\
    <img src="styles/legend/JARDIMMORI_1_5.png" /> BLOQUEADO<br />\
    <img src="styles/legend/JARDIMMORI_1_6.png" /> <br />' });

lyr_GoogleTerrain_0.setVisible(true);lyr_JARDIMMORI_1.setVisible(true);
var layersList = [lyr_GoogleTerrain_0,lyr_JARDIMMORI_1];
lyr_JARDIMMORI_1.set('fieldAliases', {'QUADRA': 'QUADRA', 'LOTE': 'LOTE', 'QDLT': 'QDLT', 'STATUS': 'STATUS', 'SITUACAO': 'SITUACAO', });
lyr_JARDIMMORI_1.set('fieldImages', {'QUADRA': 'Range', 'LOTE': 'Range', 'QDLT': 'TextEdit', 'STATUS': 'TextEdit', 'SITUACAO': '', });
lyr_JARDIMMORI_1.set('fieldLabels', {'QUADRA': 'header label - always visible', 'LOTE': 'header label - always visible', 'QDLT': 'hidden field', 'STATUS': 'hidden field', 'SITUACAO': 'header label - always visible', });
lyr_JARDIMMORI_1.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});