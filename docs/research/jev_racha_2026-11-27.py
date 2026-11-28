#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-27: la racha de publicar, otra vez.

La auditoría del 24 nov dio 0 % de utilidad a la racha tal como está (días
seguidos, se rompe el día que el negocio no abre). Parco quiere conservar el
incentivo para el lado difícil, pero hecho como lo hacen las empresas grandes:
  - Apple (watchOS 11): metas por día de la semana y pausar sin perder la racha.
  - Microsoft Rewards: días de protección al año.
  - GitHub (2016): quitó el contador de racha y dejó el registro del trabajo.
  - Google Business Profile: le dice al negocio cuánta gente lo vio.
Preguntas a negocios:
  1. Cuál de cinco formas te haría volver a publicar.
  2. Escalas: qué tanto te motiva cada una y qué tanto te presiona la actual.
Uso: python3 docs/research/jev_racha_2026-11-27.py docs/research/jev-racha-2026-11-27.json
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

APP = ("Una app mexicana de celular donde fondas, cocinas económicas, puestos y restaurantes publican qué hay hoy: el menú del día, "
       "lo que se acabó y avisos para quienes los siguen. Quien busca dónde comer ve en el mapa cada lugar con su ficha. "
       "Al negocio le sirve que quienes lo siguen vean cada día su menú; si no publica, su ficha dice que no hay menú de hoy.")
NEGOCIOS = {
    "fonda": "una señora de 52 años con una fonda en la colonia Doctores; abre de lunes a sábado y cierra el domingo",
    "economica": "un señor de 45 años con una cocina económica cerca de oficinas en Polanco; abre solo entre semana",
    "taquero": "un taquero de 34 años con un puesto en la calle en Iztapalapa; abre casi todos los días pero a veces descansa sin avisar",
    "tianguis": "una mujer de 39 años que vende quesadillas y guisados en tianguis solo martes, jueves y domingo",
    "casa": "una mamá de 36 años que vende comida hecha en su casa a vecinos y oficinas; algunas semanas no cocina",
    "restaurantera": "una restaurantera de 44 años con una cocina de comida corrida y 6 empleados en Coyoacán; abre diario",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

FORMAS = {
    "dias_seguidos": "Un contador de días seguidos publicando. Si un día no publicas, aunque ese día no abras, vuelve a cero.",
    "dias_que_abres": "Un contador que solo cuenta los días que tu negocio abre según tu horario: el día que cierras no lo rompe. Si te vas de vacaciones o enfermas, lo pausas y no se pierde.",
    "semanas": "Un contador de semanas en las que publicaste todos los días que abriste. Además tienes unos días al año que te cubren si un día se te olvida.",
    "resultado": "Sin contador. Cada vez que publicas, la app te dice cuánta gente vio tu menú hoy y cuántos te siguen, comparado con la semana pasada.",
    "nada": "Nada de eso: solo publicas tu menú y ya.",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def escala(persona, pregunta):
    return preguntar({"app": APP}, {"r": {"type": "score", "criteria": GRADO,
                                          "instructions": f"Piensa como {persona}. {pregunta}"}})["r"]

def leer(p, persona):
    base = sum(map(ord, p))
    return p, {
        "forma": elegir(persona, FORMAS, "¿Cuál de estas formas te haría volver a la app a publicar tu menú del día con más ganas?", base + 1),
        "escalas": {
            k: escala(persona, f"La app te muestra esto: «{v}» ¿Qué tanto te motivaría a publicar tu menú cada día que abres?")
            for k, v in FORMAS.items() if k != "nada"
        } | {
            "presion_dias_seguidos": escala(persona, f"La app te muestra esto: «{FORMAS['dias_seguidos']}» ¿Qué tanto te haría sentir presionado o regañado?"),
        },
    }

def main():
    with ThreadPoolExecutor(max_workers=6) as pool:
        crudo = {"app": APP, "formas": FORMAS, "negocios": dict(pool.map(lambda kv: leer(*kv), NEGOCIOS.items()))}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    elec, esc = {}, {}
    for p, r in crudo["negocios"].items():
        print(f"\n{p}: elige {r['forma']['choice']} {({a: round(b, 2) for a, b in r['forma']['probabilities'].items()})}")
        print("  escalas:", {n: round(x["score"], 2) for n, x in r["escalas"].items()})
        for o, pr in r["forma"]["probabilities"].items(): elec.setdefault(o, []).append(pr)
        for n, x in r["escalas"].items(): esc.setdefault(n, []).append(x["score"])
    print("\nPromedio elección:", {o: round(sum(v) / len(v), 2) for o, v in elec.items()})
    print("Promedio escalas (0–4):", {o: round(sum(v) / len(v), 2) for o, v in esc.items()})

main()
