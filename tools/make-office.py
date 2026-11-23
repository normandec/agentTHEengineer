#!/usr/bin/env python3
"""Create small, valid DOCX or XLSX artifacts without third-party packages.

This is intentionally a dependable fallback for council workers. Give it plain
UTF-8 text for a Word document or CSV for a workbook, then upload the resulting
real Office package through the classroom signed-upload protocol.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
SHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def write_zip(path: Path, parts: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in parts.items():
            archive.writestr(name, content.encode("utf-8"))


def core_properties(title: str) -> str:
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>{escape(title)}</dc:title><dc:creator>AI CLASSROOM council</dc:creator><cp:lastModifiedBy>AI CLASSROOM council</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>'''


def root_relationships() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{PACKAGE_REL}"><Relationship Id="rId1" Type="{OFFICE_REL}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="{OFFICE_REL}/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="{OFFICE_REL}/extended-properties" Target="docProps/app.xml"/></Relationships>'''


def docx_parts(source: str, title: str) -> dict[str, str]:
    paragraphs = [line.rstrip() for line in source.splitlines()]
    if not paragraphs:
        paragraphs = [""]
    body = []
    if title:
        body.append(f'<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>{escape(title)}</w:t></w:r></w:p>')
    for paragraph in paragraphs:
        if not paragraph:
            body.append("<w:p/>")
            continue
        # Preserve a simple line break while emitting valid XML.
        runs = "<w:br/>".join(f"<w:t xml:space=\"preserve\">{escape(piece)}</w:t>" for piece in paragraph.split("\n"))
        body.append(f"<w:p><w:r>{runs}</w:r></w:p>")
    document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{WORD_NS}"><w:body>{''.join(body)}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>'''
    return {
        "[Content_Types].xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>''',
        "_rels/.rels": root_relationships(),
        "word/document.xml": document,
        "docProps/core.xml": core_properties(title),
        "docProps/app.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>AI CLASSROOM</Application></Properties>''',
    }


def column_name(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def xlsx_cell(ref: str, value: str) -> str:
    clean = value.strip()
    if clean.startswith("=") and len(clean) > 1:
        return f"<c r=\"{ref}\"><f>{escape(clean[1:])}</f><v>0</v></c>"
    if re.fullmatch(r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", clean):
        return f"<c r=\"{ref}\"><v>{escape(clean)}</v></c>"
    return f"<c r=\"{ref}\" t=\"inlineStr\"><is><t xml:space=\"preserve\">{escape(value)}</t></is></c>"


def xlsx_parts(source: str, title: str, sheet_name: str) -> dict[str, str]:
    rows = list(csv.reader(source.splitlines())) or [[""]]
    row_xml = []
    for row_number, row in enumerate(rows, start=1):
        cells = "".join(xlsx_cell(f"{column_name(column)}{row_number}", value) for column, value in enumerate(row, start=1))
        row_xml.append(f'<row r="{row_number}">{cells}</row>')
    sheet = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{SHEET_NS}"><sheetData>{''.join(row_xml)}</sheetData></worksheet>'''
    safe_sheet = (sheet_name or "Data")[:31].replace("[", "(").replace("]", ")").replace(":", "-").replace("*", "-").replace("?", "-").replace("/", "-").replace("\\", "-")
    return {
        "[Content_Types].xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>''',
        "_rels/.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>''',
        "xl/workbook.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{SHEET_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="{escape(safe_sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>''',
        "xl/_rels/workbook.xml.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>''',
        "xl/worksheets/sheet1.xml": sheet,
        "xl/styles.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="{SHEET_NS}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>''',
        "docProps/core.xml": core_properties(title),
        "docProps/app.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>AI CLASSROOM</Application><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>{escape(safe_sheet)}</vt:lpstr></vt:vector></TitlesOfParts></Properties>''',
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kind", choices=("docx", "xlsx"), help="Office file format to create")
    parser.add_argument("--input", required=True, type=Path, help="UTF-8 text or CSV source file")
    parser.add_argument("--output", required=True, type=Path, help="Destination .docx or .xlsx path")
    parser.add_argument("--title", default="AI CLASSROOM artifact", help="Document title")
    parser.add_argument("--sheet-name", default="Data", help="Workbook sheet name for xlsx")
    args = parser.parse_args()
    try:
        source = args.input.read_text(encoding="utf-8")
    except OSError as error:
        parser.error(f"could not read input: {error}")
    expected = f".{args.kind}"
    if args.output.suffix.lower() != expected:
        parser.error(f"output must end in {expected}")
    parts = docx_parts(source, args.title) if args.kind == "docx" else xlsx_parts(source, args.title, args.sheet_name)
    write_zip(args.output, parts)
    print(f"created {args.output} ({args.kind}, {len(parts)} package parts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
