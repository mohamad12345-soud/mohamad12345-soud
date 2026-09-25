#!/usr/bin/env python3
"""تحويل ترميز وليبل app_layers.lyrx إلى إعدادات طبقات لـ ArcGIS Maps SDK for JavaScript.

الرموز تُنقل كما هي كـ CIMSymbol (نفس الشكل تماماً)، والليبل يُحوَّل إلى TextSymbol.
الناتج: app/layers-config.js

الاستخدام:  python3 project/tools/lyrx_to_js.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "project", "layers", "app_layers.lyrx")
OUT = os.path.join(ROOT, "app", "layers-config.js")

# مفاتيح إضافية لكل طبقة (لا توجد في lyrx): معرّف ثابت للكود ونوع الـ popup
IDS = {
    "التجمعات السكانية 2026": "localities",
    "المحافظة": "governorates",
    "حدود المحافظات": "govBorders",
    "حدود فلسطين": "border",
    "A B C تقسيمات اتفاقية اوسلو": "oslo",
    "جدار الضم والتوسع": "wall",
    "المستعمرات الإسرائيلية": "settlements",
    "البؤر الإستعمارية": "outposts",
    "القرى الفلسطينية المهجرة": "displaced",
}


# خطوط غير موجودة على خادم خطوط ArcGIS (static.arcgis.com/fonts) → أقرب بديل فيه حروف عربية
FONT_MAP = {"Tahoma": "Arial"}


def rgba(c):
    """لون CIM (قيم 0-255 + شفافية 0-100) إلى [r,g,b,a]."""
    v = c["values"]
    if c["type"] != "CIMRGBColor":
        raise ValueError("unsupported color " + c["type"])
    return [round(v[0]), round(v[1]), round(v[2]), round(v[3] / 100, 3) if len(v) > 3 else 1]


def js_colors(o):
    """ألوان CIM في ArcGIS Pro ({type: CIMRGBColor, values:[r,g,b,شفافية 0-100]})
    تتحول إلى صيغة JS SDK: مصفوفة [r,g,b,a] حيث a من 0 إلى 255."""
    if isinstance(o, dict):
        if o.get("type") == "CIMRGBColor":
            v = o["values"]
            return [round(v[0]), round(v[1]), round(v[2]), round((v[3] if len(v) > 3 else 100) * 2.55)]
        return {k: js_colors(v) for k, v in o.items()}
    if isinstance(o, list):
        return [js_colors(v) for v in o]
    return o


def cim(sym_ref):
    return {"type": "cim", "data": {"type": "CIMSymbolReference", "symbol": js_colors(sym_ref["symbol"])}}


def renderer(r):
    if r["type"] == "CIMSimpleRenderer":
        return {"type": "simple", "symbol": cim(r["symbol"])}
    if r["type"] == "CIMUniqueValueRenderer":
        infos = []
        for g in r["groups"]:
            for c in g["classes"]:
                for v in c["values"]:
                    infos.append({"value": v["fieldValues"][0], "label": c["label"], "symbol": cim(c["symbol"])})
        out = {"type": "unique-value", "field": r["fields"][0], "uniqueValueInfos": infos}
        if r.get("useDefaultSymbol") and r.get("defaultSymbol"):
            out["defaultSymbol"] = cim(r["defaultSymbol"])
            out["defaultLabel"] = r.get("defaultLabel")
        return out
    raise ValueError("unsupported renderer " + r["type"])


def arcade(expr):
    # $feature["X"] أو $feature.X  →  نفس التعبير (Arcade مدعوم مباشرة في JS)
    return expr.strip()


def label_class(lc, geom):
    ts = lc["textSymbol"]["symbol"]
    fill = next(l for l in ts["symbol"]["symbolLayers"] if l["type"] == "CIMSolidFill")
    sym = {
        "type": "text",
        "color": rgba(fill["color"]),
        "font": {
            "family": FONT_MAP.get(ts.get("fontFamilyName"), ts.get("fontFamilyName", "Arial")),
            "size": ts.get("height", 10),
            "weight": "bold" if "Bold" in ts.get("fontStyleName", "") else "normal",
        },
    }
    halo = ts.get("haloSymbol")
    if halo and ts.get("haloSize"):
        hfill = next(l for l in halo["symbolLayers"] if l["type"] == "CIMSolidFill")
        sym["haloColor"] = rgba(hfill["color"])
        sym["haloSize"] = ts["haloSize"]
    placement = {"polygon": "always-horizontal", "point": "above-center", "polyline": "center-along"}[geom]
    out = {
        "labelExpressionInfo": {"expression": arcade(lc["expression"])},
        "labelPlacement": placement,
        "symbol": sym,
    }
    if lc.get("minimumScale"):
        out["minScale"] = lc["minimumScale"]
    if lc.get("maximumScale"):
        out["maxScale"] = lc["maximumScale"]
    return out


def geometry_of(renderer_json):
    s = json.dumps(renderer_json)
    if "CIMPointSymbol" in s:
        return "point"
    if "CIMLineSymbol" in s:
        return "polyline"
    return "polygon"


def main():
    d = json.load(open(SRC, encoding="utf-8"))
    layers = []
    # ترتيب ArcGIS Pro: الأول بالقائمة = الأعلى. في JS الأول بالمصفوفة = الأسفل، فنعكس.
    for L in reversed(d["layerDefinitions"]):
        conn = L["featureTable"]["dataConnection"]
        base = re.search(r"URL=([^;]+)", conn["workspaceConnectionString"]).group(1)
        geom = geometry_of(L["renderer"])
        lay = {
            "id": IDS[L["name"]],
            "title": L["name"],
            "url": base + "/" + str(conn["dataset"]),
            "visible": bool(L.get("visibility")),
            "opacity": round(1 - (L.get("transparency") or 0) / 100, 3),
            "renderer": renderer(L["renderer"]),
            # labelVisibility غير موجودة في lyrx = الليبل مطفأ في ArcGIS Pro
            "labelsVisible": bool(L.get("labelVisibility")),
            "labelingInfo": [label_class(lc, geom) for lc in L.get("labelClasses", []) if lc.get("visibility", True)],
        }
        if L.get("minScale"):
            lay["minScale"] = L["minScale"]
        if L.get("maxScale"):
            lay["maxScale"] = L["maxScale"]
        layers.append(lay)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// مولَّد تلقائياً من project/layers/app_layers.lyrx بواسطة project/tools/lyrx_to_js.py — لا تعدّله يدوياً.\n")
        f.write("window.APP_LAYERS = ")
        json.dump(layers, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print("wrote", OUT, len(layers), "layers")


if __name__ == "__main__":
    main()
