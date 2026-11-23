"""Draws the logo in logo/ from Geist at weight 800.

The logo is "ab" in lowercase Geist 800, set tight, with a block cursor
after it in the mark colour (DESIGN.md §5, "The logo"). This script outlines
the letters so the logo doesn't wait on the font, and prints the path data
that logo/paths.mjs, logo/mark.svg and logo/tile.svg carry.

Run it only to redraw the logo: python3 scripts/logo.py (needs fonttools and
brotli: pip install fonttools brotli).
"""
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

TRACKING = -65     # units of a 1000-unit em: -0.065em between a and b
GAP = 90           # b to cursor
CURSOR_W = 340     # the block cursor, as wide as a narrow letter
CURSOR_H = 550     # baseline to the top of the a

font = instantiateVariableFont(TTFont('fonts/geist-latin-wght-normal.woff2'), {'wght': 800})
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()

def bounds(ch):
    pen = BoundsPen(glyphs)
    glyphs[cmap[ord(ch)]].draw(pen)
    return pen.bounds

a, b = bounds('a'), bounds('b')
b_x = glyphs[cmap[ord('a')]].width + TRACKING
left = a[0]
cursor_x0 = b_x + b[2] + GAP
cursor_x1 = cursor_x0 + CURSOR_W
bottom, top = min(a[1], b[1]), max(a[3], b[3])

def fmt(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s

def draw(scale, dx, dy):
    """Letters and cursor at scale, offset so the mark's top-left lands at (dx, dy)."""
    pen = SVGPathPen(glyphs, ntos=fmt)
    for ch, x in (('a', 0), ('b', b_x)):
        tp = TransformPen(pen, (scale, 0, 0, -scale, dx + (x - left) * scale, dy + top * scale))
        glyphs[cmap[ord(ch)]].draw(tp)
    x0 = dx + (cursor_x0 - left) * scale
    y0 = dy + (top - CURSOR_H) * scale
    w, h = CURSOR_W * scale, CURSOR_H * scale
    cursor = f'M{fmt(x0)} {fmt(y0)}h{fmt(w)}v{fmt(h)}h{fmt(-w)}z'
    return pen.getCommands(), cursor

# The bare mark: 24 high, no padding.
mh = 24
ms = mh / (top - bottom)
mw = (cursor_x1 - left) * ms
letters, cursor = draw(ms, 0, 0)

# The tile: 24 x 24, the mark 16 wide and centred on its own box.
tw = 16
ts = tw / (cursor_x1 - left)
th = (top - bottom) * ts
t_letters, t_cursor = draw(ts, (24 - tw) / 2, (24 - th) / 2)

print(json.dumps({
    'mark': {'width': round(mw, 2), 'height': mh, 'letters': letters, 'bar': cursor},
    'tile': {'letters': t_letters, 'bar': t_cursor},
}, indent=2))
