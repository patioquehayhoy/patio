#!/usr/bin/env python3
"""Junta fotos de menús reales para estudiarlos (2026-11-15).

Mismo camino que SYSTEMA Lab con los Reels: Apify junta, Jev clasifica
(menus_jev_clasificar_2026-11-15.py) y el informe cruza
(menus_informe_2026-11-15.py). Dos fuentes, porque cada una ve algo distinto:

  · Google Maps: fondas de varias zonas de la CDMX con hasta 20 fotos cada una
    y QUIÉN subió cada foto (el negocio o un cliente). Ahí salen el pizarrón o
    la carta fija y las fotos de platillos.
  · Instagram (#comidacorrida, #cocinaeconomica…): el menú del día como lo
    publican hoy los negocios, con su texto.

Lo que no sale en internet (quien vende en casa por WhatsApp) se cubre con
fotos tomadas en la calle.

Uso (la llave de Apify es la de SYSTEMA Lab):
  APIFY_TOKEN=… python3 docs/research/menus_juntar_2026-11-15.py piloto
  APIFY_TOKEN=… python3 docs/research/menus_juntar_2026-11-15.py completo

Piloto ≈ 1.5 USD de Apify (12 giros × 4 zonas × 2 lugares ≈ 90 lugares con 15
fotos, y 150 publicaciones); sirve para medir cuántas fotos son menús antes
del completo (≈ 8 USD: 12 zonas × 6 lugares por giro con 20 fotos, 800 publicaciones).
Salida, fuera de git (son fotos de terceros, solo para estudio interno):
  docs/research/menus-gmaps/maps.json · ig.json · fotos/…
"""
import json, os, re, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "menus-gmaps"
TOKEN = os.environ["APIFY_TOKEN"]
MODO = sys.argv[1] if len(sys.argv) > 1 else "piloto"

# Todos los giros chicos de comida, no solo fondas (Parco, 15 nov).
BUSQUEDAS = ["fonda", "cocina económica", "comida corrida", "taquería", "restaurante", "antojitos",
             "mariscos", "pozolería", "tortería", "cafetería", "comida casera", "pollos rostizados"]
ZONAS = {
    "piloto": ["Narvarte", "Nuevo Polanco", "Iztapalapa", "Coyoacán"],
    "completo": ["Narvarte", "Nuevo Polanco", "Iztapalapa", "Coyoacán", "Doctores", "Tlalpan", "Azcapotzalco",
                 "Gustavo A. Madero", "Roma Norte", "Iztacalco", "Álvaro Obregón", "Venustiano Carranza"],
}[MODO]
LUGARES_POR_BUSQUEDA = 2 if MODO == "piloto" else 6
FOTOS_POR_LUGAR = 15 if MODO == "piloto" else 20
HASHTAGS = ["comidacorrida", "comidacorridacdmx", "cocinaeconomica", "menudeldiacdmx", "fondacdmx",
            "tacoscdmx", "taqueriacdmx", "antojitoscdmx", "restaurantescdmx", "comidacaseracdmx"]
POSTS_POR_HASHTAG = 15 if MODO == "piloto" else 80


def api(method, path, body=None):
    req = urllib.request.Request(f"https://api.apify.com/v2{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as error:
        raise SystemExit(f"Apify {error.code}: {error.read()[:400].decode(errors='replace')}")


def correr(actor, entrada, tope_usd):
    run = api("POST", f"/acts/{actor}/runs?maxTotalChargeUsd={tope_usd}", entrada)["data"]
    while run["status"] in ("READY", "RUNNING"):
        time.sleep(10)
        run = api("GET", f"/actor-runs/{run['id']}")["data"]
    costo = round(run.get("usageTotalUsd") or 0, 3)
    if run["status"] != "SUCCEEDED":
        print(f"  {actor}: terminó en {run['status']} ({costo} USD)")
        return [], costo
    req = urllib.request.Request(f"https://api.apify.com/v2/datasets/{run['defaultDatasetId']}/items?clean=true&format=json",
                                 headers={"Authorization": f"Bearer {TOKEN}"})
    return json.load(urllib.request.urlopen(req, timeout=120)), costo


def bajar(url, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(url, destino)
        return True
    except Exception as error:
        print("   sin foto:", destino.name, str(error)[:80])
        return False


def plano(texto):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", texto or "") if unicodedata.category(c) != "Mn").lower().strip()


def google_maps():
    lugares, vistos, gasto = [], set(), 0.0
    for zona in ZONAS:
        print(f"Maps · {zona}")
        items, costo = correr("compass~crawler-google-places", {
            "searchStringsArray": BUSQUEDAS,
            "locationQuery": f"{zona}, Ciudad de México, México",
            "maxCrawledPlacesPerSearch": LUGARES_POR_BUSQUEDA,
            "language": "es",
            "maxImages": FOTOS_POR_LUGAR,
            "scrapeImageAuthors": True,   # ¿la subió el negocio o un cliente?
        }, tope_usd=0.5 if MODO == "piloto" else 1.2)
        gasto += costo
        for place in items:
            pid = place.get("placeId") or place.get("url")
            if not pid or pid in vistos:
                continue
            vistos.add(pid)
            nombre = place.get("title") or "lugar"
            slug = re.sub(r"[^a-z0-9]+", "-", plano(nombre)).strip("-")[:40] + "-" + str(pid)[-6:]
            fotos = []
            imagenes = place.get("images") or [{"imageUrl": u} for u in (place.get("imageUrls") or [])]
            for n, img in enumerate(imagenes[:FOTOS_POR_LUGAR], 1):
                url = img.get("imageUrl") if isinstance(img, dict) else img
                autor = img.get("authorName") if isinstance(img, dict) else None
                destino = ROOT / "fotos" / "maps" / slug / f"{n:02d}.jpg"
                if url and bajar(url, destino):
                    fotos.append({
                        "archivo": str(destino.relative_to(ROOT)),
                        "autor": autor,
                        # En Maps, la foto del negocio va firmada con su nombre.
                        "del_negocio": bool(autor) and (plano(autor) == plano(nombre) or plano(nombre) in plano(autor)),
                    })
            lugares.append({
                "slug": slug, "zona": zona, "busqueda": place.get("searchString"), "nombre": nombre, "categoria": place.get("categoryName"),
                "colonia": place.get("neighborhood"), "calificacion": place.get("totalScore"),
                "resenas": place.get("reviewsCount"), "precio": place.get("price"),
                "menu_url": place.get("menu"), "url": place.get("url"), "fotos": fotos,
            })
    (ROOT / "maps.json").write_text(json.dumps(lugares, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"Maps: {len(lugares)} lugares, {sum(len(l['fotos']) for l in lugares)} fotos · {round(gasto, 3)} USD")
    return gasto


def instagram():
    print("Instagram · " + ", ".join("#" + h for h in HASHTAGS))
    items, costo = correr("apify~instagram-hashtag-scraper", {
        "hashtags": HASHTAGS, "resultsType": "posts", "resultsLimit": POSTS_POR_HASHTAG,
    }, tope_usd=0.5 if MODO == "piloto" else 2.2)
    posts = []
    for post in items:
        codigo = post.get("shortCode") or post.get("id")
        if not codigo or post.get("type") == "Video":
            continue
        urls = (post.get("images") or [])[:4] or [post.get("displayUrl")]
        fotos = []
        for n, url in enumerate(u for u in urls if u):
            destino = ROOT / "fotos" / "ig" / f"{codigo}-{n}.jpg"
            if bajar(url, destino):
                fotos.append(str(destino.relative_to(ROOT)))
        if fotos:
            posts.append({
                "codigo": codigo, "cuenta": post.get("ownerUsername"), "fecha": post.get("timestamp"),
                "lugar": post.get("locationName"), "texto": (post.get("caption") or "")[:2000],
                "url": post.get("url"), "fotos": fotos,
            })
    (ROOT / "ig.json").write_text(json.dumps(posts, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"Instagram: {len(posts)} publicaciones con foto · {costo} USD")
    return costo


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    total = google_maps() + instagram()
    print(f"\nListo. Costo Apify: {round(total, 3)} USD → {ROOT}")
    print("Sigue: python3 docs/research/menus_jev_clasificar_2026-11-15.py docs/research/menus-gmaps/jev.json docs/research/menus-gmaps/fotos")
    print("y:     python3 docs/research/menus_informe_2026-11-15.py")
