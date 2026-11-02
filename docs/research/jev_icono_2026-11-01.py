#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre el ícono de la pestaña Mi Patio y las etiquetas de la barra. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde los dueños de fondas publican su menú del día y la gente lo ve en un mapa. "
       "Abajo hay una barra de cinco botones para el dueño: Mis menús (ícono de libro), Actividad (ícono de corazón), "
       "un botón + al centro para crear el menú de hoy, un botón que abre la ficha de su fonda tal como la ven los clientes "
       "(nombre, menú de hoy, horario, reseñas y si está abierta), y Perfil (ícono de persona) con su cuenta y ajustes.")
DUENO = "el dueño de una fonda en Ciudad de México que usa la app cada mañana"
ICONOS = {
    "a": "Una tiendita con toldo, de frente.",
    "b": "Un plato con cuchillo y tenedor.",
    "c": "Un pin de ubicación como el de un mapa.",
    "d": "Un ojo, como de vista previa.",
    "e": "Una tarjeta con una foto pequeña y dos renglones, como una ficha.",
    "f": "Un toldo a rayas como el de una fonda de barrio, sin el resto del local.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "por_icono": {}, "elecciones": [], "etiquetas": []}
    for k, icono in ICONOS.items():
        crudo["por_icono"][k] = preguntar({"app": APP, "icono": icono}, {
            "entiende": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {DUENO}. Si el botón de la ficha de su fonda tuviera `icono`, ¿qué tanto entendería sin leer nada que ahí ve su fonda como la ven sus clientes?"},
            "confunde_perfil": {"type": "noul", "instructions": f"Piensa como {DUENO}. ¿Confundiría `icono` con el botón de Perfil, que tiene un ícono de persona?"},
            "le_gusta": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {DUENO}. ¿Qué tanto le gustaría ver `icono` todos los días en la barra?"},
        })
    random.seed(20261101)
    for _ in range(3):
        orden = list(ICONOS); random.shuffle(orden)
        crudo["elecciones"].append({"orden": orden, "respuesta": preguntar(
            {"app": APP, "iconos": {k: ICONOS[k] for k in orden}},
            {"elige": {"type": "choice", "criteria": {k: f"El ícono `iconos.{k}`." for k in orden},
                       "instructions": f"Piensa como {DUENO}. ¿Cuál de los `iconos` usarías para el botón que abre la ficha de tu fonda tal como la ven tus clientes?"}})})
    opciones = {
        "a": "La barra muestra solo los cinco íconos, sin texto.",
        "b": "La barra muestra cada ícono con una palabra corta debajo: Menús, Actividad, Crear, Mi fonda, Perfil.",
    }
    for _ in range(3):
        orden = list(opciones); random.shuffle(orden)
        crudo["etiquetas"].append({"orden": orden, "respuesta": preguntar(
            {"app": APP, "opciones": {k: opciones[k] for k in orden}},
            {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                       "instructions": f"Piensa como {DUENO}. ¿Con cuál de las `opciones` se movería más rápido y sin dudas por la app?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    print("icono  entiende  confunde_perfil  le_gusta")
    for k, a in crudo["por_icono"].items():
        print(f"{k:6}{a['entiende']['score']:9.2f}{a['confunde_perfil']['noul']:17.2f}{a['le_gusta']['score']:10.2f}")
    for e in crudo["elecciones"]:
        r = e["respuesta"]["elige"]; print("icono elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})
    for e in crudo["etiquetas"]:
        r = e["respuesta"]["elige"]; print("etiquetas elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
