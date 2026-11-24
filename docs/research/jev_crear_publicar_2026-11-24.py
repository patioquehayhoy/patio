#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-24: cómo empezar a crear, qué pasa al publicar y qué abre el menú de hoy en Menús.

Negocios (el lado difícil):
  1. Cómo nombrar el menú que la gente ya puede ver hoy («Publicado hoy» y alternativas).
  2. Cuántas lecturas de menú con foto gratis al día.
  3. Qué tan probable es pagar Pro, o dejar la app, si se acaban 3 lecturas en un día.
  4. Qué tanto molesta registrarse con correo para publicar y ver sus números.
  5. Panorámica: lo que más les sirve y lo que más les cuesta de la app.
Comensales:
  6. Si se pide correo para ver el mapa.
  7. Panorámica: lo que más les sirve y lo que más les cuesta.
Uso: python3 docs/research/jev_crear_publicar_2026-11-24.py docs/research/jev-crear-publicar-2026-11-24.json
"""
import json, os, random, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde fondas, cocinas económicas, taquerías y personas que venden comida en casa publican "
       "su menú del día. Se puede tomar foto del pizarrón (la app lo escribe sola), elegir una foto de la galería, escribirlo a mano "
       "o partir del menú de ayer. Abajo hay una barra con un botón «+» para crear.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte, CDMX; cambia los guisados cada día",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 no para de servir",
    "cocina": "un hombre de 34 años con una cocina económica y dos empleados que quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
    "taquero": "un taquero de 38 años en Iztapalapa",
    "desayunos": "un señor de 60 años con un puesto de desayunos que abre a las 7",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]
CREAR = {
    "camara": "Al tocar «+» se abre la cámara de una vez, lista para tomar la foto; abajo están Fotos y Escribir a mano.",
    "pantalla": "Al tocar «+» se abre una pantalla Crear con opciones grandes: tomar foto del menú (la más grande), elegir de Fotos, escribir a mano, partir del menú de ayer, y avisos.",
    "hoja": "Al tocar «+» sube desde abajo una hojita con la lista de opciones.",
    "editor": "Al tocar «+» se abre el menú vacío para escribir, con un botón de cámara arriba.",
}
DESPUES = {
    "poster": "Te muestra el póster del menú con «Publicado» arriba y un botón para compartirlo.",
    "menus": "Regresas a tu lista de menús, con un aviso arriba «Publicado, ya lo ven en tu ficha» y un botón para compartir la imagen.",
    "ficha": "Te lleva a tu ficha, como la ve la gente.",
}
TOCAR = {
    "editar": "Se abre para cambiarlo (quitar lo que se acabó, cambiar un precio).",
    "ficha": "Se abre tu ficha, como la ve la gente.",
}
ANTES = {
    "directo": "Al tocar «Publicar» se publica de una vez.",
    "vista_previa": "Al tocar «Publicar» primero te enseña cómo se va a ver y ahí confirmas.",
    "opcional": "Al tocar «Publicar» se publica de una vez, y si quieres, antes puedes tocar «Vista previa».",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def escala(persona, pregunta):
    return preguntar({"app": APP}, {"r": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. {pregunta}"}})["r"]

def leer(p, persona):
    base = sum(map(ord, p))
    return p, {
        "crear": elegir(persona, CREAR, "Son las 12 y quieres publicar lo de hoy. ¿Cómo prefieres que funcione el botón «+»?", base + 1),
        "antes": elegir(persona, ANTES, "¿Cómo prefieres publicar?", base + 2),
        "despues": elegir(persona, DESPUES, "Ya publicaste. ¿Qué prefieres que pase?", base + 3),
        "tocar": elegir(persona, TOCAR, "En tu lista de menús, arriba está el menú que la gente ve hoy. Si lo tocas, ¿qué esperas?", base + 4),
        "escalas": {"camara_molesta": escala(persona, "Tocas «+» y se abre la cámara de una vez, sin preguntarte. ¿Qué tanto te molesta?")},
    }

def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        negocios = dict(pool.map(lambda kv: leer(*kv), NEGOCIOS.items()))
    crudo = {"app": APP, "opciones": {"crear": CREAR, "antes": ANTES, "despues": DESPUES, "tocar": TOCAR}, "negocios": negocios}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    totales = {}
    for p, r in negocios.items():
        print(p, {k: (v["choice"] if k != "escalas" else {n: round(x["score"], 2) for n, x in v.items()}) for k, v in r.items()})
        for k, v in r.items():
            if k == "escalas":
                for n, x in v.items(): totales.setdefault(n, []).append(x["score"])
                continue
            for o, pr in v["probabilities"].items(): totales.setdefault(k, {}).setdefault(o, []).append(pr)
    for k, v in totales.items():
        print(k, round(sum(v)/len(v), 2) if isinstance(v, list) else {o: round(sum(ps)/len(ps), 2) for o, ps in v.items()})

main()
