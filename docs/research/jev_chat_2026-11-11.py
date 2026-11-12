#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): ¿chat dentro de Patio, botón a WhatsApp o ambos? Negocios y Foodies. Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas y personas que venden comida en casa publican su menú del día "
       "tomándole una foto. La gente cercana lo ve en un mapa, sigue sus lugares y recibe aviso cuando publican. La app no toma pedidos "
       "ni cobra comisión por venta: la persona ve el menú y va al lugar.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX; usa WhatsApp y Facebook todos los días",
    "cocina": "un hombre de 34 años que tiene una cocina económica con dos empleados y quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 de la tarde no para de servir",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "estudiante": "una estudiante de 21 años que come fuera casi diario y usa TikTok e Instagram",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
}
OPCIONES = {
    "whatsapp": "En la ficha de cada lugar hay un botón «Escribir». Abre WhatsApp con el número del negocio y el mensaje «Hola, te vi en Patio». La conversación sigue en WhatsApp.",
    "chat": "En la ficha de cada lugar hay un botón «Escribir». Abre un chat dentro de la app. El negocio recibe un aviso en su celular y contesta desde la app, que muestra cuánto tarda en contestar cada negocio.",
    "ambos": "En la ficha de cada lugar hay dos botones: «Escribir» abre un chat dentro de la app y «WhatsApp» abre el WhatsApp del negocio. Cada persona elige.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]
PREGUNTAS = {
    "negocio": {
        "contesta": "¿qué tan seguido contestarías esos mensajes en menos de una hora, incluso en hora de comida?",
        "clientes": "¿qué tanto crees que te traería clientes nuevos?",
        "carga": "¿qué tanto trabajo extra o molestia te causaría?",
    },
    "foodie": {
        "escribe": "¿qué tan seguido le escribirías a un lugar antes de ir?",
        "vuelve": "¿qué tanto te haría abrir la app más seguido?",
        "confia": "¿qué tanta confianza te daría para ir a un lugar nuevo?",
    },
}

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261111)
    grupos = [("negocio", NEGOCIOS), ("foodie", FOODIES)]
    for rol, personas in grupos:
        for p, persona in personas.items():
            crudo["por_opcion"][p] = {}
            for k, opcion in OPCIONES.items():
                crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                    q: {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si la app funcionara así: `opcion`, {texto}"}
                    for q, texto in PREGUNTAS[rol].items()})
            meta = "seguir publicando tu menú en la app" if rol == "negocio" else "usar la app más seguido"
            crudo["elecciones"][p] = []
            for _ in range(3):
                orden = list(OPCIONES); random.shuffle(orden)
                crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                    {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                    {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                               "instructions": f"Piensa como {persona}. ¿Cuál de las `opciones` te haría {meta}?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for rol, personas in grupos:
        qs = list(PREGUNTAS[rol])
        for p in personas:
            print(f"\n{p}: opción  " + "  ".join(qs))
            for k, a in crudo["por_opcion"][p].items():
                print(f"  {k:9}" + "".join(f"{a[q]['score']:9.2f}" for q in qs))
            for e in crudo["elecciones"][p]:
                r = e["respuesta"]["elige"]
                print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
