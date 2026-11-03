#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre dónde van los seguidores y el botón Seguir en la ficha de un lugar. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular para saber qué preparan hoy las fondas y lugares de comida cercanos. "
       "La gente ve en un mapa el menú del día de cada lugar, sigue sus lugares favoritos para que le avisen cuando publican "
       "y deja reseñas. Al abrir un lugar se ve su ficha: arriba una foto grande; sobre la parte de abajo de la foto, el nombre "
       "del lugar en letras grandes blancas y debajo una descripción corta que escribe el negocio. Debajo de la foto, en una "
       "tarjeta blanca, la colonia y el precio, y luego el menú del día con sus precios.")
PERSONAS = {
    "oficina": "una persona de 30 años que trabaja en una oficina en Ciudad de México y abre la app a mediodía para decidir dónde comer",
    "senor": "un señor de 55 años en Ciudad de México que usa el celular para lo básico y quiere saber qué hay de comer en su fonda de siempre",
}
OPCIONES = {
    "a": "Justo debajo del nombre y la descripción, en una misma línea: «240 seguidores» a la izquierda y un botón pequeño naranja «Seguir» a la derecha.",
    "b": "Justo debajo del nombre y la descripción, los dos juntos a la derecha: «240 seguidores» y enseguida un botón pequeño naranja «Seguir». A la izquierda de esa línea no hay nada.",
    "c": "Justo debajo del nombre y la descripción: «240 seguidores», y debajo un botón naranja grande «Seguir» que ocupa todo el ancho de la pantalla.",
    "d": "Arriba a la derecha de la foto, junto al botón de compartir, un botón pequeño naranja «Seguir». «240 seguidores» va debajo del nombre.",
    "e": "«240 seguidores» debajo del nombre, sobre la foto. El botón «Seguir», pequeño y solo con contorno, va al principio de la tarjeta blanca, debajo de la foto.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261102)
    for p, persona in PERSONAS.items():
        crudo["por_opcion"][p] = {}
        for k, opcion in OPCIONES.items():
            crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                "encuentra": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan rápido encontrarías cómo seguir el lugar?"},
                "ordenada": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan ordenada y fácil de leer se vería la parte de arriba?"},
                "estorba": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tanto te estorbaría para llegar al menú del día?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` preferirías ver la ficha de un lugar?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: opción  encuentra  ordenada  estorba")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:6}{a['encuentra']['score']:10.2f}{a['ordenada']['score']:10.2f}{a['estorba']['score']:9.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
