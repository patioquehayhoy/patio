import math,os,sys
out=sys.argv[1]
ST='fill="none" stroke="#000" stroke-width="32" stroke-linejoin="round" stroke-linecap="round"'
def svg(name,*paths):
    body="\n".join(f'<path d="{d}" {ST}/>' for d in paths)
    open(f"{out}/{name}.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n{body}\n</svg>')
def scallop(cx,cy,r,a0,a1,n,br):
    pts=[(cx+r*math.cos(a),cy-r*math.sin(a)) for a in [a0+(a1-a0)*i/n for i in range(n+1)]]
    d="M%.1f %.1f"%pts[0]
    for p in pts[1:]: d+=" A%d %d 0 0 1 %.1f %.1f"%(br,br,*p)
    return d
# taco A: dome + lettuce scallops (current)
svg("taco_a","M32 400a224 224 0 0 1 448 0Z",scallop(256,400,148,math.pi,0,6,34))
# taco B: two overlapping tortillas (front full, back visible arc)
bc,br_=(288,384),192; fc,fr=(208,384),176
# intersection of circles (upper)
d=bc[0]-fc[0]; a=(fr**2-br_**2+d**2)/(2*d); h=math.sqrt(fr**2-a**2); ix=fc[0]+a; iy=fc[1]-h
svg("taco_b",f"M{fc[0]-fr} {fc[1]}a{fr} {fr} 0 0 1 {2*fr} 0Z",
    f"M{ix:.1f} {iy:.1f}A{br_} {br_} 0 0 1 {bc[0]+br_} {bc[1]}H{fc[0]+fr}")
# taco C: standing U taco with filling bumps
svg("taco_c","M64 208h384a192 192 0 0 1-384 0Z" if False else "M64 224a192 192 0 0 0 384 0Z",
    scallop(256,224,0,0,0,0,0) if False else "M80 224c0-40 32-64 64-56c8-40 56-56 88-32c24-32 80-24 96 16c40-8 80 24 80 72")
# elote A: vertical cob + husks (current)
svg("elote_a","M176 112a80 80 0 0 1 160 0v176a80 80 0 0 1-160 0Z","M256 112v176M208 176h96M208 256h96",
    "M256 480c-104-16-160-96-160-208c56 24 96 64 120 128","M256 480c104-16 160-96 160-208c-56 24-96 64-120 128")
# elote B: diagonal cob with husk leaves, kernel grid
svg("elote_b","M200 312L360 152a64 64 0 0 1 90 90L290 402","M280 232l64 64M328 184l64 64M248 288l48 48M248 216l112-24" if False else "M296 216l64 64M344 168l56 56M248 264l56 56",
    "M200 312c-48 8-104 56-136 136c80-32 128-88 136-136Z","M200 312c40 48 64 104 56 152")
# elote C: esquites cup
svg("elote_c","M112 176h288l-40 272a32 32 0 0 1-32 28H184a32 32 0 0 1-32-28Z","M144 176c0-48 40-80 80-64c16-40 80-48 104 0c40-16 72 24 72 64",
    "M208 272h0M272 256h0M240 336h0M304 320h0M256 400h0")
# botanas A: chips bag
svg("botana_a","M128 64l32 24 32-24 32 24 32-24 32 24 32-24 32 24 32-24v384H128Z","M176 368h160","M200 208a56 56 0 1 0 112 0a56 56 0 1 0-112 0" )
# botanas B: popcorn bucket
svg("botana_b","M112 208h288l-40 256H152Z","M200 208l16 256M312 208l-16 256",
    "M112 208c-24-48 24-96 64-72c8-56 80-72 104-24c32-40 104-24 104 32c40 0 56 40 16 64")
# pan: concha
svg("pan_concha","M48 368a208 160 0 0 1 416 0Z","M256 208v160","M160 240l48 128M352 240l-48 128","M96 320h320" if False else "M112 304c96-32 192-32 288 0")
# jugos: vaso con popote
svg("jugo","M128 176h256l-32 288H160Z","M144 256h224","M288 176l48-144h48")
# michelada: tarro con borde escarchado
svg("michelada","M128 128h224v304a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32Z","M352 192h32a48 48 0 0 1 48 48v80a48 48 0 0 1-48 48h-32",
    "M128 176c32 24 64 24 96 0s64-24 96 0","M224 112l-16-64")
