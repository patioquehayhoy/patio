#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): qué dominio recuerda y en cuál confía la gente para la app Patio. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Patio es una app mexicana donde las fondas, cocinas económicas y personas que venden comida en casa publican su menú del día; "
       "la gente cercana lo ve en un mapa. Su frase de marca es «¿Qué hay hoy? Saaaaaaabes.». En cada fonda habrá un cartel con un QR "
       "y una dirección web corta para ver el menú de hoy sin instalar nada.")
PERSONAS = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "estudiante": "una estudiante de 21 años que come fuera casi diario y usa TikTok e Instagram",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX; usa WhatsApp y Facebook todos los días",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco",
}
DOMINIOS = {
    "quehayhoy": "quehayhoy.mx",
    "holapatio": "holapatio.mx",
    "patiomx": "patiomx.com",
    "patiomexico": "patiomexico.mx",
    "alpatio": "alpatio.mx",
    "patiocdmx": "patiocdmx.com",
    "patiolat": "patio.lat",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "dominios": DOMINIOS, "por_dominio": {}, "elecciones": {}}
    random.seed(20261111)
    for p, persona in PERSONAS.items():
        crudo["por_dominio"][p] = {}
        for k, dominio in DOMINIOS.items():
            crudo["por_dominio"][p][k] = preguntar({"app": APP, "dominio": dominio}, {
                "recuerda": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si vieras la dirección `dominio` una sola vez en el cartel de una fonda, ¿qué tan fácil te sería recordarla y escribirla después?"},
                "confia": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanta confianza te daría abrir `dominio`?"},
                "claro": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tan claro te queda que `dominio` es de la app Patio?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(DOMINIOS); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "dominios": {k: DOMINIOS[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La dirección `dominios.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Cuál de los `dominios` recordarías y abrirías con más confianza para ver el menú de hoy?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: dominio        recuerda  confía  claro")
        for k, a in crudo["por_dominio"][p].items():
            print(f"  {DOMINIOS[k]:15}{a['recuerda']['score']:8.2f}{a['confia']['score']:8.2f}{a['claro']['score']:8.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
