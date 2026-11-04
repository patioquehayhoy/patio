#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre agregar un giro para quien vende desde casa o su edificio, y cómo llamarlo. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path
OUT = Path(sys.argv[1])
def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]
APP = ("Una app mexicana de celular para saber qué preparan hoy los lugares de comida cercanos: la gente ve en un mapa el menú del día, "
       "lo sigue y va a comer. Los giros hoy son Fondita, Tacos, Antojitos, Elotes, Botanas, Postres, Café, Mariscos, Bebidas, Jugos y fruta, Restaurante. "
       "Hay muchas personas que venden comida o bebida desde su casa o dentro de su edificio o unidad habitacional, sin local a la calle: arepas, postres, "
       "comida casera por encargo, bebidas preparadas; entregan en el edificio, por WhatsApp o en la puerta.")
PERSONAS = {
    "vende": "una mujer de 35 años que vende arepas desde su departamento en una unidad habitacional de Ciudad de México",
    "compra": "un vecino de 28 años de Ciudad de México que busca qué comer cerca de su casa",
}
NOMBRES = {"a": "Dark kitchen", "b": "Cocina en casa", "c": "Venta en casa", "d": "Por encargo", "e": "Solo a domicilio"}
def main():
    crudo = {"app": APP, "nombres": NOMBRES, "incluir": {}, "nombre": {}}
    random.seed(20261103)
    for p, persona in PERSONAS.items():
        crudo["incluir"][p] = preguntar({"app": APP}, {
            "incluir": {"type": "noul", "instructions": f"Piensa como {persona}. ¿Debería la app tener un giro aparte para quien vende desde su casa o edificio, sin local?"},
            "util": {"type": "score", "criteria": ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."], "instructions": f"Piensa como {persona}. ¿Qué tan útil te sería ver esos lugares en el mapa?"},
        })
        crudo["nombre"][p] = []
        for _ in range(3):
            orden = list(NOMBRES); random.shuffle(orden)
            crudo["nombre"][p].append({"orden": orden, "respuesta": preguntar({"app": APP, "nombres": {k: NOMBRES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"El nombre `nombres.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Cuál de los `nombres` entenderías mejor, sin explicación, para ese giro?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        a = crudo["incluir"][p]; print(p, "incluir", a["incluir"]["noul"], "útil", a["util"]["score"])
        for e in crudo["nombre"][p]:
            r = e["respuesta"]["elige"]; print("  elige:", r["choice"], {k: round(x, 2) for k, x in r["probabilities"].items()})
main()
