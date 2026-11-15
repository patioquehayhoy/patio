#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): cómo cobran el menú las fondas (uno o varios precios),
si la carta va aparte del menú del día y qué nombres usan. Negocios y Foodies. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas y personas que venden comida en casa publican su menú del día. "
       "La gente cercana lo ve en un mapa y va al lugar. La app no toma pedidos ni cobra comisión.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 de la tarde no para de servir",
    "cocina": "un hombre de 34 años que tiene una cocina económica con dos empleados y quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

COBRO = {
    "uno": "Un solo precio por el menú completo (sopa, arroz, guisado y agua).",
    "varios": "Varios precios del menú: por ejemplo completo, sin sopa, solo guisado o ejecutivo.",
    "platillo": "Cada platillo con su propio precio, sin precio de menú completo.",
    "mezcla": "Precio del menú completo y, aparte, algunos platillos con su propio precio.",
}
CARTA = {
    "todo_diario": "Cada día escribe en la app todo lo que vende, lo del día y lo de siempre.",
    "carta_aparte": "Guarda una sola vez «la carta» con lo que vende siempre y cada día solo escribe lo que cambia; la gente ve las dos cosas.",
}
NOMBRES = {
    "completo": "Completo", "comida_corrida": "Comida corrida", "menu_del_dia": "Menú del día",
    "paquete": "Paquete", "ejecutivo": "Ejecutivo", "solo_guisado": "Solo guisado", "sin_sopa": "Sin sopa",
}

def main():
    random.seed(20261114)
    crudo = {"app": APP, "negocios": {}, "foodies": {}}
    for p, persona in NEGOCIOS.items():
        r = {}
        orden = list(COBRO); random.shuffle(orden)
        r["cobro"] = preguntar({"app": APP, "formas": {k: COBRO[k] for k in orden}}, {
            "elige": {"type": "choice", "criteria": {k: f"`formas.{k}`" for k in orden},
                      "instructions": f"Piensa como {persona}. ¿Cuál de las `formas` se parece más a como cobras tu comida hoy?"}})
        orden = list(CARTA); random.shuffle(orden)
        r["carta"] = preguntar({"app": APP, "opciones": {k: CARTA[k] for k in orden}}, {
            "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                      "instructions": f"Piensa como {persona}. ¿Con cuál de las `opciones` seguirías publicando tu menú todos los días?"},
            "trabajo": {"type": "score", "criteria": GRADO,
                        "instructions": f"Piensa como {persona}. ¿Qué tanto trabajo te ahorraría `opciones.carta_aparte` frente a `opciones.todo_diario`?"}})
        r["nombres"] = preguntar({"app": APP, "nombres": NOMBRES}, {
            k: {"type": "score", "criteria": GRADO,
                "instructions": f"Piensa como {persona}. ¿Qué tanto usarías la palabra «{v}» para nombrar una forma de cobrar tu menú?"}
            for k, v in NOMBRES.items()})
        crudo["negocios"][p] = r
    for p, persona in FOODIES.items():
        crudo["foodies"][p] = preguntar({"app": APP,
            "uno": "La ficha dice: Menú del día $95.",
            "varios": "La ficha dice: Completo $95 · Sin sopa $85 · Solo guisado $70.",
            "carta": "Debajo del menú del día hay una sección «La carta» con lo que hay siempre: milanesa $110, enchiladas $85."}, {
            "varios_decide": {"type": "score", "criteria": GRADO,
                              "instructions": f"Piensa como {persona}. Frente a `uno`, ¿qué tanto te ayuda `varios` a decidir si vas?"},
            "carta_ayuda": {"type": "score", "criteria": GRADO,
                            "instructions": f"Piensa como {persona}. ¿Qué tanto te ayuda ver `carta` además del menú del día?"}})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")

    for p, r in crudo["negocios"].items():
        c = r["cobro"]["elige"]; k = r["carta"]["elige"]
        print(f"\n{p}: cobra → {c['choice']} {({a: round(b, 2) for a, b in c['probabilities'].items()})}")
        print(f"  carta → {k['choice']} {({a: round(b, 2) for a, b in k['probabilities'].items()})}  ahorro {r['carta']['trabajo']['score']:.2f}")
        print("  nombres:", {n: round(v["score"], 2) for n, v in r["nombres"].items()})
    for p, r in crudo["foodies"].items():
        print(f"\n{p}:", {q: round(v["score"], 2) for q, v in r.items()})

main()
