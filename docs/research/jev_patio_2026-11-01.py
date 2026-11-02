#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre ajustes de Patio, 1 nov 2026. Solo texto, claves neutras."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular para saber qué preparan hoy las fondas y lugares de comida cercanos. "
       "La gente ve en un mapa el menú del día de cada lugar, guarda sus lugares favoritos en listas y deja reseñas. "
       "Los dueños de fondas toman una foto de su menú del día y la app lo pasa en limpio y lo publica.")
DUENO = "el dueño de una fonda en Ciudad de México que publica su menú del día desde el celular"
COMENSAL = "una persona en Ciudad de México que busca dónde comer cerca de su trabajo"
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

PREGUNTAS = {
 "barra": (DUENO, {
   "a": "Barra inferior de 5 botones: Mis menús, Actividad (reseñas y me gusta), un botón + al centro para crear el menú del día, Mi ficha (cómo ve la gente mi lugar) y Perfil.",
   "b": "Barra inferior de 4 botones: Mis menús, Actividad, un botón + para crear el menú del día y Perfil.",
   "c": "Barra inferior de 3 botones: Mis menús, Actividad y Perfil. El botón + para crear el menú del día está arriba, dentro de Mis menús."},
   "¿Con cuál de las `opciones` encontraría más rápido y con menos dudas cómo publicar el menú de hoy, cada mañana?"),
 "cuenta": (DUENO, {
   "a": "Una sola cuenta con el mismo correo: puede ver la app como comensal y cambiar a modo negocio cuando quiera.",
   "b": "Dos cuentas separadas: una para su negocio y otra personal para buscar dónde comer."},
   "¿Cuál de las `opciones` preferiría?"),
 "beneficio": (DUENO, {
   "a": "Una insignia de negocio verificado junto al nombre de su lugar.",
   "b": "Aparecer antes que otros lugares en el mapa y en la lista.",
   "c": "Ver cuántas personas guardaron su lugar en sus listas.",
   "d": "Ningún beneficio extra; publicar su menú ya es suficiente."},
   "¿Cuál de las `opciones` le haría sentir que vale más la pena usar la app?"),
 "cobro": (DUENO, {
   "a": "La app es gratis para publicar el menú diario; más adelante habrá un plan de pago opcional con extras como promociones.",
   "b": "Un mes de prueba gratis y después un pago mensual para seguir publicando.",
   "c": "Un pago mensual desde el primer día."},
   "¿Con cuál de las `opciones` se animaría a empezar a usar la app?"),
}

def main():
    crudo = {"app": APP, "elecciones": {}, "perfil_publico": None}
    random.seed(20261101)
    for clave, (quien, opciones, instr) in PREGUNTAS.items():
        crudo["elecciones"][clave] = []
        for _ in range(3):
            orden = list(opciones); random.shuffle(orden)
            r = preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {quien}. {instr}"}})
            crudo["elecciones"][clave].append({"orden": orden, "respuesta": r})
    perfil = ("En la app, el perfil de cada comensal es público, como en Instagram: cualquiera puede ver su nombre, foto, "
              "reseñas y las listas que decide hacer públicas. No hay opción de perfil privado; se puede bloquear a otra cuenta.")
    crudo["perfil_publico"] = preguntar({"app": APP, "regla": perfil}, {
        "comodo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {COMENSAL}. ¿Qué tan cómodo estaría con `regla`?"},
        "le_preocupa": {"type": "noul", "instructions": f"Piensa como {COMENSAL}. ¿`regla` le preocuparía lo suficiente para no dejar reseñas?"},
        "pide_privado": {"type": "noul", "instructions": f"Piensa como {COMENSAL}. ¿Echaría de menos poder poner su perfil en privado?"},
    })
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for clave, rs in crudo["elecciones"].items():
        for e in rs:
            r = e["respuesta"]["elige"]
            print(clave, "elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})
    p = crudo["perfil_publico"]
    print("perfil_publico: comodo", round(p["comodo"]["score"], 2), "| le_preocupa", round(p["le_preocupa"]["noul"], 2), "| pide_privado", round(p["pide_privado"]["noul"], 2))

main()
