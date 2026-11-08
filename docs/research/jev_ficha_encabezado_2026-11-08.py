#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre cómo acomodar el encabezado de la ficha: dónde van colonia, distancia, precio y horario. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular para saber qué preparan hoy los lugares de comida cercanos: fondas, taquerías, cafés, postres. "
       "Al abrir un lugar se ve su ficha: arriba una foto grande con el nombre del lugar en letras grandes blancas y una descripción corta; "
       "debajo, en una tarjeta blanca, el menú de hoy con sus precios.")
PERSONAS = {
    "oficina": "una persona de 30 años que trabaja en una oficina en Ciudad de México y abre la app a mediodía para decidir dónde comer",
    "senor": "un señor de 55 años en Ciudad de México que usa el celular para lo básico y quiere saber qué hay de comer cerca",
    "estudiante": "una estudiante de 21 años en Ciudad de México que busca algo rico y barato cerca de su escuela",
}
OPCIONES = {
    "franja": ("Sobre la foto: el nombre, la descripción y una línea con «240 seguidores» y un botón naranja «Seguir». "
               "Justo al empezar la tarjeta blanca, una franja con cuatro datos en columnas, cada uno con una etiqueta chica arriba: "
               "HORARIO «Abierto · 8am–10pm», DISTANCIA «450 m · Narvarte», MENÚ «$95» y CALIFICACIÓN «4.8 (126)». Debajo, el menú de hoy."),
    "una_linea": ("Sobre la foto: el nombre, la descripción y una sola línea «240 seguidores · Narvarte · $95» con el botón naranja «Seguir» a la derecha. "
                  "En la tarjeta blanca empieza directo el menú de hoy; el horario aparece más abajo, después del menú."),
    "actual": ("Sobre la foto: el nombre, la descripción, una línea «Narvarte · 450 m · $95» y debajo «240 seguidores» con el botón naranja «Seguir». "
               "En la tarjeta blanca empieza directo el menú de hoy; el horario aparece más abajo, después del menú."),
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261108)
    for p, persona in PERSONAS.items():
        crudo["por_opcion"][p] = {}
        for k, opcion in OPCIONES.items():
            crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                "encuentra": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan rápido sabrías si está abierto, qué tan lejos está y cuánto cuesta?"},
                "ordenada": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan ordenada y fácil de leer se vería?"},
                "estorba": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tanto te estorbaría para llegar al menú de hoy?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` preferirías ver la ficha de un lugar para decidir dónde comer?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: opción     encuentra  ordenada  estorba")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:10}{a['encuentra']['score']:10.2f}{a['ordenada']['score']:10.2f}{a['estorba']['score']:9.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
