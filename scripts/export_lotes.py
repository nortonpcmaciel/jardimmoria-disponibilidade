"""Exporta o catálogo de lotes do XLSX para o JSON consumido pelo site."""

import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def cell_value(cell, shared_strings):
    value = cell.find("m:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.get("t") == "s":
        return shared_strings[int(raw)]
    return raw


def export(source, target):
    with zipfile.ZipFile(source) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.itertext()) for node in root.findall("m:si", NS)]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = sheet.findall(".//m:sheetData/m:row", NS)[1:]
        catalog = {}
        for row in rows:
            values = [cell_value(cell, shared) for cell in row.findall("m:c", NS)]
            if len(values) < 4:
                continue
            quadra, lote = int(float(values[0])), int(float(values[1]))
            code = f"{quadra:02d}-{lote:02d}"
            catalog[code] = {"area": float(values[2]), "logradouro": values[3].strip()}
    Path(target).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    export(sys.argv[1], sys.argv[2])
