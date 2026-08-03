import argparse
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"

ET.register_namespace("w", W)
ET.register_namespace("r", R)
ET.register_namespace("", REL)


def qn(ns, tag):
    return f"{{{ns}}}{tag}"


def page_number_part(justification):
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="{W}" xmlns:r="{R}">
  <w:p>
    <w:pPr><w:jc w:val="{justification}"/></w:pPr>
    <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>1</w:t></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:hdr>'''


def footer_number_part(justification):
    return page_number_part(justification).replace("<w:hdr", "<w:ftr").replace("</w:hdr>", "</w:ftr>")


def next_rid(rels_root):
    max_id = 0
    for rel in rels_root.findall(qn(REL, "Relationship")):
        rid = rel.attrib.get("Id", "")
        if rid.startswith("rId") and rid[3:].isdigit():
            max_id = max(max_id, int(rid[3:]))
    return max_id + 1


def ensure_override(types_root, part_name, content_type):
    for node in types_root.findall(qn(CT, "Override")):
        if node.attrib.get("PartName") == part_name:
            node.attrib["ContentType"] = content_type
            return
    ET.SubElement(types_root, qn(CT, "Override"), {"PartName": part_name, "ContentType": content_type})


def ensure_update_fields(settings_xml):
    root = ET.fromstring(settings_xml)
    node = root.find(qn(W, "updateFields"))
    if node is None:
        node = ET.SubElement(root, qn(W, "updateFields"))
    node.set(qn(W, "val"), "true")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def patch_docx(path: Path):
    backup = Path.cwd() / f"{path.stem}_backup_sebelum_nomor_halaman{path.suffix}"
    if not backup.exists():
        with path.open("rb") as src, backup.open("wb") as dst:
            shutil.copyfileobj(src, dst, 1024 * 1024)

    header_name = "word/header_auto_top_right_page.xml"
    footer_name = "word/footer_auto_bottom_center_page.xml"

    with zipfile.ZipFile(path, "r") as zin:
        doc = ET.fromstring(zin.read("word/document.xml"))
        rels = ET.fromstring(zin.read("word/_rels/document.xml.rels"))
        types = ET.fromstring(zin.read("[Content_Types].xml"))
        settings = zin.read("word/settings.xml") if "word/settings.xml" in zin.namelist() else None

        rid_num = next_rid(rels)
        header_rid = f"rId{rid_num}"
        footer_rid = f"rId{rid_num + 1}"

        ET.SubElement(rels, qn(REL, "Relationship"), {
            "Id": header_rid,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            "Target": "header_auto_top_right_page.xml",
        })
        ET.SubElement(rels, qn(REL, "Relationship"), {
            "Id": footer_rid,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            "Target": "footer_auto_bottom_center_page.xml",
        })

        ensure_override(types, "/word/header_auto_top_right_page.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml")
        ensure_override(types, "/word/footer_auto_bottom_center_page.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml")

        sects = doc.findall(f".//{qn(W, 'sectPr')}")
        for sect in sects:
            for child in list(sect):
                if child.tag in (qn(W, "headerReference"), qn(W, "footerReference"), qn(W, "titlePg")):
                    sect.remove(child)
            header = ET.Element(qn(W, "headerReference"), {qn(W, "type"): "default", qn(R, "id"): header_rid})
            footer = ET.Element(qn(W, "footerReference"), {qn(W, "type"): "first", qn(R, "id"): footer_rid})
            titlepg = ET.Element(qn(W, "titlePg"))
            sect.insert(0, titlepg)
            sect.insert(0, footer)
            sect.insert(0, header)

        tmp = Path(tempfile.mkstemp(suffix=".docx")[1])
        skip = {"word/document.xml", "word/_rels/document.xml.rels", "[Content_Types].xml", header_name, footer_name}
        if settings is not None:
            skip.add("word/settings.xml")

        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename in skip:
                    continue
                zout.writestr(item, zin.read(item.filename))
            zout.writestr("word/document.xml", ET.tostring(doc, encoding="utf-8", xml_declaration=True))
            zout.writestr("word/_rels/document.xml.rels", ET.tostring(rels, encoding="utf-8", xml_declaration=True))
            zout.writestr("[Content_Types].xml", ET.tostring(types, encoding="utf-8", xml_declaration=True))
            zout.writestr(header_name, page_number_part("right").encode("utf-8"))
            zout.writestr(footer_name, footer_number_part("center").encode("utf-8"))
            if settings is not None:
                zout.writestr("word/settings.xml", ensure_update_fields(settings))

    with tmp.open("rb") as src, path.open("wb") as dst:
        shutil.copyfileobj(src, dst, 1024 * 1024)
    tmp.unlink(missing_ok=True)
    print(f"Updated: {path}")
    print(f"Backup:  {backup}")
    print(f"Sections patched: {len(sects)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("docx")
    args = parser.parse_args()
    patch_docx(Path(args.docx))
