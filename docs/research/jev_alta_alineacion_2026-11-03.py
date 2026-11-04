#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre alinear al centro o a la izquierda los pasos del alta del negocio. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde los dueños de fondas publican su menú del día. Para registrarse, el dueño "
       "pasa por cinco pantallas cortas: nombre del negocio, tipo de lugar, ubicación, días y horarios, y formas de pago. "
       "Cada pantalla tiene un título grande, una frase corta que explica para qué sirve, el campo o las opciones, y un botón «Continuar».")
DUENO = {
    "joven": "una dueña de 32 años de una fonda en Ciudad de México que usa Instagram y WhatsApp todo el día",
    "mayor": "un dueño de 58 años de una fonda en Ciudad de México que usa el celular para WhatsApp y poco más",
}
OPCIONES = {
    "a": "Todo centrado: el título, la frase y el botón al centro de la pantalla; los campos a todo lo ancho.",
    "b": "Todo alineado a la izquierda: el título y la frase empiezan en el mismo margen que los campos, y el botón «Continuar» va abajo a todo lo ancho.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261103)
    for p, persona in DUENO.items():
        crudo["por_opcion"][p] = {k: preguntar({"app": APP, "opcion": o}, {
            "lee": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Con las pantallas así: `opcion`, ¿qué tan rápido entenderías qué te piden en cada una?"},
            "confia": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Con las pantallas así: `opcion`, ¿qué tan profesional y confiable se vería la app?"},
        }) for k, o in OPCIONES.items()}
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` llenarías más fácil y rápido tu registro?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in DUENO:
        print(f"\n{p}: opción  lee  confía")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:6}{a['lee']['score']:6.2f}{a['confia']['score']:8.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
