#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre dónde van las reseñas en la ficha de un lugar. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular para saber qué preparan hoy los lugares de comida cercanos: fondas, taquerías, cafés, postres. "
       "Al abrir un lugar se ve su ficha: arriba una foto grande con el nombre, una descripción corta y una línea «240 seguidores · 450 m · $95» "
       "con un botón «Seguir». Debajo, en una tarjeta, el menú de hoy por secciones con precios; luego el horario, qué tan lleno está y un mapa.")
PERSONAS = {
    "oficina": "una persona de 30 años que trabaja en una oficina en Ciudad de México y abre la app a mediodía para decidir dónde comer",
    "senor": "un señor de 55 años en Ciudad de México que usa el celular para lo básico y quiere saber qué hay de comer cerca",
    "estudiante": "una estudiante de 21 años en Ciudad de México que busca algo rico y barato cerca de su escuela",
}
OPCIONES = {
    "abajo": ("Las reseñas van hasta abajo de la ficha, después del menú, el horario y el mapa: calificación promedio, barras por estrellas y las reseñas. "
              "Arriba no se ve la calificación."),
    "resumen_arriba": ("Arriba, en la línea de la foto, se ve «★ 4.8 (126 reseñas)» junto a seguidores, distancia y precio; al tocarla baja a las reseñas. "
                       "Las reseñas completas siguen hasta abajo, después del menú, el horario y el mapa."),
    "arriba": ("Justo debajo de la foto, antes del menú, un carrusel con 3 reseñas destacadas que se deslizan de lado y la calificación promedio. "
               "Después viene el menú de hoy, el horario y el mapa."),
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261109)
    for p, persona in PERSONAS.items():
        crudo["por_opcion"][p] = {}
        for k, opcion in OPCIONES.items():
            crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                "confianza": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tanto te ayudaría a confiar en el lugar para ir a comer?"},
                "menu": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan rápido llegarías a ver qué hay de comer hoy?"},
                "ordenada": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la ficha fuera así: `opcion`, ¿qué tan ordenada y fácil de leer se vería?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` preferirías ver la ficha de un lugar para decidir dónde comer hoy?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: opción          confianza  menú  ordenada")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:15}{a['confianza']['score']:9.2f}{a['menu']['score']:6.2f}{a['ordenada']['score']:9.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
