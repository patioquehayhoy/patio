#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-23: sucursales, franquicias y quién entra a la cuenta del negocio.

Negocios con más de un lugar o con gente que ayuda (puestos de una misma marca, franquicia,
cadena, fonda donde la hija publica):
  1. Quién publica cada día lo que hay en cada lugar.
  2. Cómo entran los encargados: cada uno con su correo e invitación, la cuenta del dueño, o un celular del negocio.
  3. Qué puede hacer un encargado.
  4. Quién decide la carta y los precios cuando hay varias sucursales.
  5. Qué tanto importa saber quién publicó o cambió algo y a qué hora.
Comensales:
  6. Qué esperan al seguir una marca con varias sucursales.
Uso: python3 docs/research/jev_sucursales_y_equipo_2026-11-23.py docs/research/jev-sucursales-y-equipo-2026-11-23.json
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
       "lo que se acabó y avisos para quienes los siguen. Quien busca dónde comer ve en el mapa cada lugar con su ficha.")
NEGOCIOS = {
    "alitas": "un hombre de 41 años dueño de tres puestos de alitas con el mismo nombre (en Azcapotzalco, Lerma y Naucalpan); en cada puesto hay un encargado y él va de uno a otro",
    "encargada": "una mujer de 26 años, empleada y encargada de uno de esos puestos de alitas; abre a las 2 y es la que sabe qué se acabó",
    "franquicia": "un hombre de 48 años que compró la franquicia de dos sucursales de una marca conocida de desayunos y antojitos",
    "gerente": "una gerente de 35 años de una sucursal de una cadena grande de restaurantes y cafeterías con cientos de sucursales en México",
    "fonda_hija": "una señora de 58 años con una fonda; su hija de 24 es la que maneja el celular y publica el menú",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
    "foraneo": "un estudiante de 21 años que llegó de Oaxaca a la CDMX",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

QUIEN_PUBLICA = {
    "dueno": "El dueño, desde su celular, para todos los lugares.",
    "encargado": "El encargado de cada lugar, que está ahí y sabe qué hay y qué se acabó.",
    "celular": "Quien esté en turno, con un celular del negocio que se queda en el lugar.",
}
COMO_ENTRAN = {
    "invitacion": "El dueño invita a cada encargado con su propio correo; cada quien entra con su cuenta y solo ve su sucursal. El dueño le quita el acceso cuando quiera.",
    "cuenta_dueno": "Todos entran con la cuenta y el correo del dueño.",
    "celular": "Un celular del negocio en cada lugar, ya con la cuenta abierta.",
}
QUE_HACE = {
    "solo_estado": "Solo marcar lo que se acabó y si ya abrió o no abre hoy.",
    "publicar": "Publicar el menú del día de su sucursal, marcar lo que se acabó y mandar avisos de su sucursal; sin tocar la carta, los precios ni el pago.",
    "todo_menos_pago": "Todo en su sucursal, incluida la carta y los precios; sin tocar el pago ni quién entra.",
    "todo": "Todo, igual que el dueño.",
}
CARTA = {
    "central": "El dueño o el corporativo decide la carta y los precios para todas las sucursales.",
    "cada_una": "Cada sucursal decide su carta y sus precios.",
    "central_ajustes": "El dueño o el corporativo pone la carta para todas; cada sucursal puede cambiar un precio, quitar lo que ahí no vende y publicar su menú del día.",
}
SEGUIR = {
    "sucursal": "Sigues una sucursal en específico (la que te queda cerca) y te llegan solo sus avisos.",
    "marca_cercana": "Sigues la marca y te llegan los avisos de la sucursal más cercana a ti.",
    "marca_elegir": "Sigues la marca y eliges de cuáles sucursales quieres avisos.",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def leer_negocio(p, persona):
    base = sum(map(ord, p))
    return p, {
        "quien_publica": elegir(persona, QUIEN_PUBLICA, "En tu negocio, ¿quién debería publicar cada día qué hay hoy y lo que se acabó?", base + 1),
        "como_entran": elegir(persona, COMO_ENTRAN, "Si en tu negocio más de una persona usa la app, ¿cómo prefieres que entren?", base + 2),
        "que_hace": elegir(persona, QUE_HACE, "¿Qué debería poder hacer en la app la persona encargada de una sucursal (o quien ayuda), que no es la dueña?", base + 3),
        "carta": elegir(persona, CARTA, "Cuando un negocio tiene varias sucursales, ¿quién debería decidir la carta y los precios en la app?", base + 4),
        "escalas": preguntar({"app": APP}, {
            "quien_cambio": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te importa poder ver quién publicó o cambió algo en la app y a qué hora?"},
        }),
    }

def leer_foodie(p, persona):
    base = sum(map(ord, p))
    return p, {
        "seguir": elegir(persona, SEGUIR, "Te gustan unas alitas que tienen varias sucursales con el mismo nombre. Tocas «Seguir». ¿Qué esperas que pase?", base + 1),
    }

def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        negocios = pool.map(lambda kv: leer_negocio(*kv), NEGOCIOS.items())
        foodies = pool.map(lambda kv: leer_foodie(*kv), FOODIES.items())
        crudo = {"app": APP, "opciones": {"quien_publica": QUIEN_PUBLICA, "como_entran": COMO_ENTRAN, "que_hace": QUE_HACE,
                                         "carta": CARTA, "seguir": SEGUIR},
                 "negocios": dict(negocios), "foodies": dict(foodies)}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for grupo in ("negocios", "foodies"):
        totales = {}
        print(f"\n== {grupo} ==")
        for p, r in crudo[grupo].items():
            print(f"\n{p}")
            for k, v in r.items():
                if k == "escalas":
                    print("  escalas:", {n: round(x["score"], 2) for n, x in v.items()})
                    for n, x in v.items():
                        totales.setdefault(f"escala {n}", {}).setdefault("score", []).append(x["score"])
                    continue
                print(f"  {k}: {v['choice']} {({a: round(b, 2) for a, b in v['probabilities'].items()})}")
                for opcion, prob in v["probabilities"].items():
                    totales.setdefault(k, {}).setdefault(opcion, []).append(prob)
        print(f"\nPromedio {grupo}:")
        for k, opciones in totales.items():
            print(f"  {k}: {({o: round(sum(ps) / len(ps), 2) for o, ps in opciones.items()})}")

main()
