#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): fotos de platillos al mantener presionado.
¿Quién debe poner la foto y la descripción (el negocio o los comensales)?
¿Ayuda a decidir? ¿Cuánto trabajo es para el negocio? Negocios y Foodies. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas y personas que venden comida en casa publican su menú del día "
       "y su carta. La gente cercana lo ve en un mapa y va al lugar. El menú se ve como lista de texto; si mantienes presionado un "
       "platillo, aparece una foto grande del platillo con una descripción corta.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 no para de servir",
    "cocina": "un hombre de 34 años que tiene una cocina económica con dos empleados y quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
    "foraneo": "un estudiante de 21 años que llegó de Oaxaca a la CDMX y no conoce algunos platillos de la carta",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

QUIEN_FOTO = {
    "negocio": "Solo el negocio sube las fotos de sus platillos.",
    "comensales": "Solo los comensales suben fotos de lo que comieron ahí.",
    "ambos": "Las dos: la foto del negocio va primero y, aparte, se ven las de los comensales marcadas como «de un cliente».",
}
QUIEN_DESC = {
    "negocio": "La descripción corta la escribe el negocio (qué lleva, cómo se sirve).",
    "comensales": "La descripción sale de lo que dicen los comensales en sus reseñas.",
}
CUANDO_FOTO = {
    "carta": "Fotos solo para la carta (lo de siempre): se toman una vez y sirven meses.",
    "diario": "Fotos también para el menú del día, cada día.",
}

def elegir(persona, opciones, pregunta):
    orden = list(opciones); random.shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def main():
    random.seed(20261115)
    crudo = {"app": APP, "negocios": {}, "foodies": {}}
    for p, persona in NEGOCIOS.items():
        r = {
            "quien_foto": elegir(persona, QUIEN_FOTO, "¿Cuál de las `opciones` te parece mejor para tu negocio?"),
            "quien_desc": elegir(persona, QUIEN_DESC, "¿Cuál de las `opciones` prefieres para tus platillos?"),
            "cuando_foto": elegir(persona, CUANDO_FOTO, "¿Cuál de las `opciones` sí harías de verdad?"),
        }
        r["escalas"] = preguntar({"app": APP}, {
            "subiria": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto subirías fotos de tus platillos si es opcional?"},
            "miedo_cliente": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te preocupa que un cliente suba una foto fea o injusta de tu comida?"},
            "trabajo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto trabajo te parece tomar y subir una foto por platillo de tu carta, una sola vez?"},
        })
        crudo["negocios"][p] = r
    for p, persona in FOODIES.items():
        r = {
            "quien_foto": elegir(persona, QUIEN_FOTO, "¿Con cuál de las `opciones` le creerías más a la foto?"),
            "quien_desc": elegir(persona, QUIEN_DESC, "¿Cuál de las `opciones` te ayuda más a saber qué es un platillo?"),
        }
        r["escalas"] = preguntar({"app": APP}, {
            "ayuda_decidir": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te ayuda ver la foto al mantener presionado un platillo para decidir si vas?"},
            "confia_negocio": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto le crees a una foto que subió el propio negocio?"},
            "confia_cliente": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto le crees a una foto que subió otro cliente?"},
            "descubre": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si junto a algunos platillos hay un ícono pequeño de foto y arriba dice «Mantén presionado un platillo con el ícono para ver su foto», ¿qué tanto lo entenderías a la primera?"},
        })
        crudo["foodies"][p] = r
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")

    def ch(x): return f"{x['choice']} {({a: round(b, 2) for a, b in x['probabilities'].items()})}"
    for grupo in ("negocios", "foodies"):
        for p, r in crudo[grupo].items():
            print(f"\n{grupo}/{p}")
            for k, v in r.items():
                if k == "escalas": print("  escalas:", {n: round(x["score"], 2) for n, x in v.items()})
                else: print(f"  {k}: {ch(v)}")

main()
