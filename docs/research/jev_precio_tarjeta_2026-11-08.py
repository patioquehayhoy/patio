#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre cómo mostrar el precio de un lugar en la lista y la ficha. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular para saber qué preparan hoy los lugares de comida cercanos: fondas, taquerías, cafés, marisquerías. "
       "En la lista de lugares cercanos cada tarjeta muestra el nombre, la colonia, la distancia, la calificación y, a la derecha, un precio. "
       "Al abrir un lugar se ve el menú de hoy completo, con el precio de cada platillo. "
       "Tres lugares de ejemplo: Fonda Lupita (comida corrida de $95 con sopa, arroz, guisado y agua; además aguas de $20 y postres de $30), "
       "Tacos El Güero (tacos de $18 a $38, órdenes para compartir de $120 a $145, refrescos de $25) y "
       "Mariscos La Ola (cocteles de $150 a $350, platos de $220 a $380, una mariscada para cuatro de $1,250 y aguas de $35).")
PERSONAS = {
    "oficina": "una persona de 30 años que trabaja en una oficina en Ciudad de México y abre la app a mediodía para decidir dónde comer",
    "senor": "un señor de 55 años en Ciudad de México que usa el celular para lo básico y quiere saber qué hay de comer cerca",
    "estudiante": "una estudiante de 21 años en Ciudad de México que busca algo rico y barato cerca de su escuela",
}
OPCIONES = {
    "rango_completo": ("La tarjeta muestra el rango del menú, del platillo más barato al más caro: "
                       "Fonda Lupita «$20–95», Tacos El Güero «$18–145», Mariscos La Ola «$35–1,250»."),
    "precio_tipico": ("La tarjeta muestra un solo precio típico: el de la comida corrida si la hay; si no, lo que cuesta un platillo típico del menú, "
                      "sin contar bebidas: Fonda Lupita «$95», Tacos El Güero «$28», Mariscos La Ola «$280»."),
    "rango_central": ("La tarjeta muestra el rango donde cae la mayoría de los platillos, sin los extremos: "
                      "Fonda Lupita «$95», Tacos El Güero «$24–38», Mariscos La Ola «$220–350»."),
    "nivel": ("La tarjeta muestra un nivel de precio con signos de pesos, de uno a cuatro: "
              "Fonda Lupita «$», Tacos El Güero «$», Mariscos La Ola «$$$»."),
    "sin_precio": ("La tarjeta no muestra precio; los precios solo se ven al abrir el menú de cada lugar."),
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261110)
    for p, persona in PERSONAS.items():
        crudo["por_opcion"][p] = {}
        for k, opcion in OPCIONES.items():
            crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                "presupuesto": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la lista fuera así: `opcion`, ¿qué tanto te ayudaría a saber cuánto vas a gastar al comer ahí?"},
                "comparar": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la lista fuera así: `opcion`, ¿qué tan fácil sería comparar qué lugar es más barato o más caro?"},
                "sorpresa": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la lista fuera así: `opcion`, ¿qué tan seguro estarías de no llevarte una sorpresa al pagar?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` preferirías ver el precio en la lista para decidir dónde comer hoy?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: opción           presupuesto comparar sorpresa")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:16}{a['presupuesto']['score']:10.2f}{a['comparar']['score']:9.2f}{a['sorpresa']['score']:9.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
