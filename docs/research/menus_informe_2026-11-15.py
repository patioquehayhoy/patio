#!/usr/bin/env python3
"""Cruza lo que juntó Apify con lo que clasificó Jev (2026-11-15).

Lee docs/research/menus-gmaps/{maps.json, ig.json, jev.json} y escribe
docs/research/menus-gmaps/informe.md con:
  · cuántos lugares tienen foto de su menú y cómo están hechos;
  · cómo cobran: un precio del menú, varios, carta con precio común,
    excepciones con precio propio;
  · quién sube las fotos de platillos en Maps: el negocio o los clientes;
  · las palabras que usan en Instagram para nombrar el menú;
  · 20 fotos al azar para revisar a mano cuánto acierta Jev (calibración).
"""
import json, random, re, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "menus-gmaps"
UMBRAL = 0.5


def cargar(nombre, defecto):
    ruta = ROOT / nombre
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else defecto


def plano(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto or "") if unicodedata.category(c) != "Mn").lower()


def pct(n, total):
    return f"{round(100 * n / total)} % ({n}/{total})" if total else "—"


def main():
    maps, ig, jev = cargar("maps.json", []), cargar("ig.json", []), cargar("jev.json", {})
    # Las llaves de jev.json pueden ser rutas absolutas o relativas.
    por_archivo = {}
    for ruta, r in jev.items():
        if "error" in r:
            continue
        p = Path(ruta)
        clave = str(p.resolve().relative_to(ROOT.resolve())) if p.is_absolute() and ROOT.resolve() in p.resolve().parents else ruta.split("menus-gmaps/")[-1]
        por_archivo[clave] = r

    def es_menu(r): return r and r["es_menu"]["si"] and not r["es_platillo"]["si"]
    def mejor_menu(archivos):
        candidatos = [por_archivo[a] for a in archivos if es_menu(por_archivo.get(a))]
        return max(candidatos, key=lambda r: r["legible"], default=None)

    lineas = ["# Menús reales — lo que encontró Jev", ""]

    def estructura(titulo, menus):
        total = len(menus)
        lineas.append(f"## {titulo}: {total} menús")
        if not total:
            lineas.append("")
            return
        for campo, nombre in (("formato", "Cómo está hecho"), ("precio_menu", "Precio del menú del día"), ("carta", "Carta aparte")):
            conteo = Counter(m[campo]["es"] for m in menus)
            lineas.append(f"- **{nombre}:** " + " · ".join(f"{k} {pct(v, total)}" for k, v in conteo.most_common()))
        for campo, nombre in (("excepciones", "Platillos con precio propio distinto al de su bloque"),
                              ("incluye_bebida_postre", "Dice que incluye agua o postre"),
                              ("fecha", "Dice el día o la fecha"),
                              ("fotos_platillos", "Trae fotos de platillos")):
            lineas.append(f"- **{nombre}:** {pct(sum(m[campo]['si'] for m in menus), total)}")
        tiempos = sum(m["llaves"]["si"] or m["encabezados_tiempos"]["si"] for m in menus)
        lineas.append(f"- **Por tiempos (llaves o encabezados):** {pct(tiempos, total)}")
        lineas.append(f"- **Legibilidad media:** {round(sum(m['legible'] for m in menus) / total, 2)} de 4")
        lineas.append("")

    # Google Maps
    con_fotos = [l for l in maps if l["fotos"]]
    menus_maps = [m for m in (mejor_menu([f["archivo"] for f in l["fotos"]]) for l in con_fotos) if m]
    lineas.append(f"Google Maps: {len(maps)} lugares; {pct(len(menus_maps), len(con_fotos))} tienen foto de su menú.")
    lineas.append("")
    estructura("Google Maps", menus_maps)

    # Por giro: cuántos tienen menú en foto y cómo cobran.
    lineas.append("## Por giro (Google Maps)")
    giros = {}
    for l in con_fotos:
        giros.setdefault(l.get("busqueda") or l.get("categoria") or "otro", []).append(l)
    for giro, lista in sorted(giros.items(), key=lambda x: -len(x[1])):
        menus_g = [m for m in (mejor_menu([f["archivo"] for f in l["fotos"]]) for l in lista) if m]
        n = len(menus_g)
        lineas.append(f"- **{giro}** ({len(lista)} lugares): menú en foto {pct(n, len(lista))} · "
                      f"un precio del menú {pct(sum(m['precio_menu']['es'] == 'uno' for m in menus_g), n)} · "
                      f"precio por platillo {pct(sum(m['precio_menu']['es'] == 'ninguno' for m in menus_g), n)} · "
                      f"carta aparte {pct(sum(m['carta']['es'] != 'no' for m in menus_g), n)}")
    lineas.append("")

    fotos = [f for l in maps for f in l["fotos"] if f["archivo"] in por_archivo]
    platillos = [f for f in fotos if por_archivo[f["archivo"]]["es_platillo"]["si"]]
    menus_f = [f for f in fotos if es_menu(por_archivo[f["archivo"]])]
    lineas.append("## Quién sube las fotos en Google Maps")
    lineas.append(f"- **Todas:** del negocio {pct(sum(f['del_negocio'] for f in fotos), len(fotos))}")
    lineas.append(f"- **Fotos de platillos:** del negocio {pct(sum(f['del_negocio'] for f in platillos), len(platillos))}")
    lineas.append(f"- **Fotos del menú:** del negocio {pct(sum(f['del_negocio'] for f in menus_f), len(menus_f))}")
    lineas.append("")

    # Instagram
    menus_ig = [m for m in (mejor_menu(p["fotos"]) for p in ig) if m]
    lineas.append(f"Instagram: {len(ig)} publicaciones; {pct(len(menus_ig), len(ig))} traen el menú en foto.")
    lineas.append("")
    estructura("Instagram", menus_ig)
    palabras = {
        "comida corrida": r"comida corrida", "menú del día": r"menu del dia", "menú": r"\bmenu\b",
        "carta / a la carta": r"\bcarta\b", "completo": r"\bcomplet[oa]\b", "solo guisado": r"solo guisado",
        "sin sopa": r"sin sopa", "paquete": r"\bpaquete", "ejecutivo": r"ejecutiv", "precio con $": r"\$\s?\d",
    }
    textos = [plano(p["texto"]) for p in ig]
    lineas.append(f"## Palabras en el texto de Instagram ({len(textos)} publicaciones)")
    for nombre, patron in palabras.items():
        lineas.append(f"- «{nombre}»: {pct(sum(bool(re.search(patron, t)) for t in textos), len(textos))}")
    lineas.append("")

    # Calibración: 20 fotos de menú al azar para revisar a mano.
    random.seed(20261115)
    muestra = random.sample([a for a, r in por_archivo.items() if es_menu(r)], k=min(20, sum(es_menu(r) for r in por_archivo.values())))
    lineas.append("## Calibración: revisar a mano")
    lineas.append("Comparar lo que dice Jev con la foto; si una pregunta falla seguido, se reformula y se vuelve a correr solo esa.")
    for a in muestra:
        r = por_archivo[a]
        lineas.append(f"- `{a}` · precio {r['precio_menu']['es']} · carta {r['carta']['es']} · excepciones {r['excepciones']['si']}")
    texto = "\n".join(lineas) + "\n"
    (ROOT / "informe.md").write_text(texto, encoding="utf-8")
    print(texto)


if __name__ == "__main__":
    main()
