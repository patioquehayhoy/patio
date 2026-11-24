#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-23: cadenas grandes y franquicias en Patio.

Cadenas y franquicias (corporativo, gerente de sucursal, dueño de marca que franquicia, franquiciatario):
  1. Qué publicarían cada día.
  2. Quién publica lo de hoy en la cadena.
  3. Cómo dan de alta sus sucursales.
  4. Quién da y quita el acceso cuando cambia un gerente.
  5. Si los precios cambian entre sucursales.
  6. En franquicia, quién paga.
  7. Qué tan dispuestos están a mostrar documentos para proteger su nombre (0–4).
Lado difícil (fondas) y comensales:
  8. Cómo deberían aparecer las cadenas junto a los negocios de la colonia.
  9. Qué tanto les preocupa o estorba (0–4).
Uso: python3 docs/research/jev_cadenas_2026-11-23.py docs/research/jev-cadenas-2026-11-23.json
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
       "La app nació para los negocios de la colonia.")
CADENAS = {
    "corporativo": "un gerente de marketing de 39 años en el corporativo de una cadena mexicana de restaurantes familiares con 150 sucursales en el país",
    "gerente": "una gerente de 33 años de una sucursal de esa cadena, en una plaza comercial; tiene 25 personas a su cargo y el personal rota seguido",
    "franquiciante": "un señor de 52 años dueño de una marca de tortas que vende franquicias; tiene 4 sucursales propias y 18 franquiciadas",
    "franquiciatario": "un hombre de 45 años que compró la franquicia de dos sucursales de esa marca de tortas",
}
LOCALES = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte, CDMX; cambia los guisados cada día",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 no para de servir",
    "taquero": "un taquero de 38 años en Iztapalapa",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
    "foraneo": "un estudiante de 21 años que llegó de Oaxaca a la CDMX",
    "vista": "un señor de 67 años que tiene la letra del celular en grande porque ya no ve bien de cerca",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

QUE_PUBLICA = {
    "menu_dia": "El menú del día o la comida corrida de cada sucursal.",
    "promocion": "La promoción o el platillo especial de hoy.",
    "estado": "Solo lo que se acabó, si abrimos y horarios especiales.",
    "nada": "Nada a diario; solo tener la carta y la ubicación.",
}
QUIEN_PUBLICA = {
    "corporativo": "El corporativo publica todo, para todas las sucursales.",
    "mixto": "El corporativo publica el menú o la promoción para todas o para una zona; cada sucursal marca lo que se acabó, si abre y sus avisos.",
    "sucursal": "Cada sucursal publica todo lo suyo.",
}
ALTA = {
    "hoja": "Subir una hoja de cálculo con todas las sucursales (dirección, horario, gerente) y revisarla.",
    "asistida": "Que alguien de la app las dé de alta contigo en una llamada, con tu lista de sucursales.",
    "una_por_una": "Darlas de alta una por una desde el celular.",
}
ACCESO = {
    "corporativo": "Solo el corporativo o el dueño de la marca.",
    "a_cargo": "Quien está a cargo de esas sucursales (gerente de zona o franquiciatario); el corporativo ve quién entra.",
    "saliente": "El gerente que se va le pasa su acceso al nuevo.",
}
PRECIOS = {
    "iguales": "Iguales en todas las sucursales.",
    "algunas": "Iguales casi siempre; algunas sucursales cambian (aeropuerto, plaza cara, otra ciudad).",
    "cada_una": "Cada sucursal pone los suyos.",
}
PAGO = {
    "marca": "La marca paga la app por todas las sucursales, propias y franquiciadas.",
    "cada_quien": "La marca paga sus sucursales y cada franquiciatario paga las suyas.",
    "fondo": "La marca paga todo y lo cubre con la cuota de publicidad que ya le paga cada franquiciatario.",
}
APARECEN = {
    "igual": "Igual que cualquier lugar: en el mapa y en la búsqueda, por cercanía, sin trato especial.",
    "agrupadas": "En el mapa salen todas, pero en la lista de resultados sale solo la sucursal más cercana de cada cadena, con «Ver más sucursales».",
    "filtro": "Igual que cualquier lugar, y con un filtro para ver solo negocios de la colonia.",
    "fuera": "Que no estén en la app; es para fondas, cocinas y puestos.",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def escala(persona, pregunta):
    return preguntar({"app": APP}, {"r": {"type": "score", "criteria": GRADO,
                                           "instructions": f"Piensa como {persona}. {pregunta}"}})["r"]

def leer_cadena(p, persona):
    base = sum(map(ord, p))
    r = {
        "que_publica": elegir(persona, QUE_PUBLICA, "Si tu cadena estuviera en la app, ¿qué publicarías cada día?", base + 1),
        "quien_publica": elegir(persona, QUIEN_PUBLICA, "En tu cadena, ¿quién debería publicar lo de hoy (menú o promoción, lo que se acabó, si abre)?", base + 2),
        "alta": elegir(persona, ALTA, "¿Cómo prefieres que se den de alta todas las sucursales en la app?", base + 3),
        "acceso": elegir(persona, ACCESO, "Cuando cambia el gerente de una sucursal, ¿quién debería poder darle acceso al nuevo y quitárselo al anterior?", base + 4),
        "precios": elegir(persona, PRECIOS, "¿Cómo son los precios de la carta entre sucursales?", base + 5),
        "escalas": {"documentos": escala(persona, "Para que nadie más pueda usar el nombre de tu marca en la app, ¿qué tan dispuesto estás a mandar la constancia de situación fiscal y el registro de la marca en el IMPI?")},
    }
    if p in ("corporativo", "franquiciante", "franquiciatario"):
        r["pago"] = elegir(persona, PAGO, "En una franquicia, ¿quién debería pagar la app?", base + 6)
    return p, r

def leer_local(p, persona):
    base = sum(map(ord, p))
    return p, {
        "aparecen": elegir(persona, APARECEN, "Cadenas grandes conocidas (restaurantes familiares, cafeterías, tortas, con cientos de sucursales) también entran a la app. ¿Cómo deberían aparecer junto a tu negocio?", base + 7),
        "escalas": {"tapan": escala(persona, "¿Qué tanto te preocupa que las cadenas grandes tapen a tu negocio en la app?")},
    }

def leer_foodie(p, persona):
    base = sum(map(ord, p))
    return p, {
        "aparecen": elegir(persona, APARECEN, "Cadenas grandes conocidas (restaurantes familiares, cafeterías, tortas, con cientos de sucursales) también entran a la app. ¿Cómo deberían aparecer cuando buscas dónde comer?", base + 7),
        "escalas": {"estorban": escala(persona, "¿Qué tanto te estorbaría ver muchas sucursales de cadenas cuando buscas dónde comer cerca?")},
    }

def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        cadenas = pool.map(lambda kv: leer_cadena(*kv), CADENAS.items())
        locales = pool.map(lambda kv: leer_local(*kv), LOCALES.items())
        foodies = pool.map(lambda kv: leer_foodie(*kv), FOODIES.items())
        crudo = {"app": APP, "opciones": {"que_publica": QUE_PUBLICA, "quien_publica": QUIEN_PUBLICA, "alta": ALTA, "acceso": ACCESO,
                                         "precios": PRECIOS, "pago": PAGO, "aparecen": APARECEN},
                 "cadenas": dict(cadenas), "locales": dict(locales), "foodies": dict(foodies)}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for grupo in ("cadenas", "locales", "foodies"):
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
