import re,sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
src,out=sys.argv[1],sys.argv[2]
import json,os
names=json.loads(sys.argv[3]) if len(sys.argv)>3 else {'taco':0xE001,'corn':0xE002}
glyphs={'.notdef':TTGlyphPen(None).glyph()}
for n in names:
    svg=open(f'{src}/{n}.pico.svg').read()
    pen=TTGlyphPen(None)
    tp=TransformPen(Cu2QuPen(pen,1.0,reverse_direction=True),(1,0,0,-1,0,448))
    for d in re.findall(r' d="([^"]+)"',svg): parse_path(d,tp)
    glyphs[n]=pen.glyph()
fb=FontBuilder(512,isTTF=True)
fb.setupGlyphOrder(list(glyphs)); fb.setupCharacterMap({v:k for k,v in names.items()})
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({k:(512,0) for k in glyphs})
fb.setupHorizontalHeader(ascent=454,descent=-71)
fb.setupNameTable({'familyName':'PatioGiros','styleName':'Regular'})
fb.setupOS2(sTypoAscender=454,sTypoDescender=-71,usWinAscent=454,usWinDescent=71)
fb.setupPost(); fb.save(out); print('saved',out)
