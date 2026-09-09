# README – Standalone qgis2web Export

ATUALIZAÇÃO ONLINE: consulte ATUALIZACAO.md. A página atualizar.html
usa a API do GitHub para salvar alterações compartilhadas no GitHub Pages.
As instruções de abertura local abaixo se aplicam à exportação original.

This export is completely "self-contained".

To view the map, simply open "index.html" by double-clicking it.
No web server or additional software is required.

The map works because all the required JavaScript libraries are included
in the export. The application loads the GeoJSON layer data and their styles
directly from the local files.

## Publishing on a Website

If you upload the entire folder to a web server, the map will work 
immediately by opening the "index.html" file.

Example:

"https://www.example.com/my-map/index.html"
