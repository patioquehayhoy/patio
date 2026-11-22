#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): acomodar y quitar platillos, ¿como las apps del celular? (2026-11-21).
Solo negocios (el lado difícil). Solo texto.
1. Qué celular usa.
2. Cómo acomodar los platillos: mantener presionado mientras escribe, «Ordenar» con rayitas (como Recordatorios) o flechas.
3. Escalas: qué tanto deja de usar la app si al mover algo se queda trabado; qué tanto importa que se sienta igual que las apps del celular.
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

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas, taquerías y personas que venden comida en casa publican "
       "su menú del día. El negocio escribe su menú en una pantalla donde cada sección es una tarjeta con sus platillos (foto, nombre, "
       "descripción y precio). A veces hay que cambiar el orden de los platillos o quitar los de ayer.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte, CDMX; cambia los guisados cada día",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón; escribe el menú rápido antes de abrir, con prisa",
    "cocina": "un hombre de 34 años con una cocina económica y dos empleados",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos",
    "taquero": "un taquero de 38 años en Iztapalapa",
    "desayunos": "un señor de 60 años con un puesto de desayunos que abre a las 7",
}
CELULAR = {
    "iphone": "Un iPhone.",
    "android": "Un celular Android (Samsung, Motorola, Xiaomi u otro).",
}
ACOMODAR = {
    "mantener": "Mientras escribes el menú, mantienes presionado un platillo y lo arrastras a donde va.",
    "ordenar": "Tocas «Ordenar», a cada platillo le salen unas rayitas a la derecha y lo arrastras con ellas; tocas «Listo» al terminar. Igual que en las apps que ya trae tu celular, como Recordatorios o Notas.",
    "flechas": "Cada platillo tiene flechas para subirlo o bajarlo un lugar.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def leer(p, persona):
    base = sum(map(ord, p))
    return p, {
        "celular": elegir(persona, CELULAR, "¿Qué celular usas para tu negocio?", base + 1),
        "acomodar": elegir(persona, ACOMODAR, "Quieres poner el mole arriba y quitar el pozole de ayer. ¿Con cuál de las `opciones` lo harías más fácil y sin equivocarte?", base + 2),
        "escalas": preguntar({"app": APP}, {
            "trabado": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si a veces, al mover un platillo, se queda flotando o regresa solo a su lugar, ¿qué tanto dejarías de usar la app para tu menú?"},
            "igual_celular": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te importa que mover y quitar platillos se sienta exactamente igual que en las apps que ya trae tu celular?"},
        }),
    }

def main():
    with ThreadPoolExecutor(max_workers=6) as pool:
        crudo = {"app": APP, "negocios": dict(pool.map(lambda kv: leer(*kv), NEGOCIOS.items()))}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    totales = {}
    for p, r in crudo["negocios"].items():
        print(f"\n{p}")
        for k, v in r.items():
            if k == "escalas":
                print("  escalas:", {n: round(x["score"], 2) for n, x in v.items()})
                continue
            print(f"  {k}: {v['choice']} {({a: round(b, 2) for a, b in v['probabilities'].items()})}")
            for opcion, prob in v["probabilities"].items():
                totales.setdefault(k, {}).setdefault(opcion, []).append(prob)
    print("\nPromedio por pregunta:")
    for k, opciones in totales.items():
        print(f"  {k}: {({o: round(sum(ps) / len(ps), 2) for o, ps in opciones.items()})}")

main()
