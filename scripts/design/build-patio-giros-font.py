"""Build the PatioGiros icon font from stroke-expanded (picosvg) SVGs.

usage: build-patio-giros-font.py <dir with NAME.pico.svg> <out.ttf> '<{"name": codepoint}>'
"""
import json, re, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

src, out, names = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
glyphs = {'.notdef': TTGlyphPen(None).glyph()}
for name in names:
    svg = open(f'{src}/{name}.pico.svg').read()
    box = float(re.search(r'viewBox="0 0 ([\d.]+)', svg).group(1))
    scale = 512 / box
    pen = TTGlyphPen(None)
    # SVG is y-down on a 512 em; the font baseline sits 448 units from the top.
    tp = TransformPen(Cu2QuPen(pen, 1.0, reverse_direction=True), (scale, 0, 0, -scale, 0, 448))
    for d in re.findall(r' d="([^"]+)"', svg):
        parse_path(d, tp)
    glyphs[name] = pen.glyph()
fb = FontBuilder(512, isTTF=True)
fb.setupGlyphOrder(list(glyphs))
fb.setupCharacterMap({v: k for k, v in names.items()})
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({k: (512, 0) for k in glyphs})
fb.setupHorizontalHeader(ascent=454, descent=-71)
FAMILY = 'PatioGiros5'
# iOS registra la fuente por su nombre PostScript: sin él no carga y muestra «?».
fb.setupNameTable({
    'familyName': FAMILY, 'styleName': 'Regular', 'fullName': f'{FAMILY} Regular',
    'psName': f'{FAMILY}-Regular', 'uniqueFontIdentifier': f'{FAMILY}-Regular-1.0', 'version': 'Version 1.000',
})
fb.setupOS2(sTypoAscender=454, sTypoDescender=-71, usWinAscent=454, usWinDescent=71)
fb.setupPost()
fb.save(out)
