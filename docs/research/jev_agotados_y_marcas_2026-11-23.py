#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-23: cómo se ve un platillo que se acabó y cómo manejar varios negocios.

Parte A · Agotados (negocios y quienes buscan dónde comer):
  1. Cómo lo hace hoy el negocio en su pizarrón o letrero.
  2. Cuál de cinco formas se entiende más rápido (comensales) y cuál prefiere el negocio.
  3. Qué tan fácil se lee lo que se acabó; si una raya encima se entiende como «ya no lo venden nunca».
Parte B · Varios negocios (solo negocios, el lado difícil):
  4. Un segundo negocio con otro nombre: cambiar como en Instagram, cuentas aparte o un solo perfil.
  5. Sucursales: un menú para todas, uno por sucursal o elegir dónde sale al publicar.
  6. Pro: un pago para todos tus negocios, uno por negocio o el segundo con descuento.
Uso: python3 docs/research/jev_agotados_y_marcas_2026-11-23.py docs/research/jev-agotados-y-marcas-2026-11-23.json
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
       "su menú del día. Quien busca dónde comer abre la ficha del lugar y ve el menú de hoy: cada platillo con su nombre, una "
       "descripción corta y su precio. Durante el día, el negocio puede marcar en la app que un platillo ya se acabó.")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte, CDMX; cambia los guisados cada día",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas de Nuevo Polanco; entre la 1 y las 4 no para de servir",
    "cocina": "un hombre de 34 años con una cocina económica y dos empleados que quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
    "taquero": "un taquero de 38 años en Iztapalapa",
    "desayunos": "un señor de 60 años con un puesto de desayunos que abre a las 7",
}
FOODIES = {
    "oficinista": "un oficinista de 28 años que trabaja en Polanco y busca dónde comer barato entre semana",
    "mama": "una mamá de 40 años que a veces compra comida hecha para su familia en su colonia",
    "foraneo": "un estudiante de 21 años que llegó de Oaxaca a la CDMX y no conoce algunos platillos",
    "vista": "un señor de 67 años que tiene la letra del celular en grande porque ya no ve bien de cerca",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

AGOTADO = {
    "tachado": "El platillo sigue en su lugar: el nombre tachado (con una raya encima) y en gris, su descripción y, donde iba el precio, «Se acabó».",
    "gris": "El platillo sigue en su lugar: el nombre en gris, sin raya, su descripción y, donde iba el precio, «Se acabó».",
    "al_final": "El platillo pasa al final de su sección: el nombre en gris, su descripción y, donde iba el precio, «Se acabó».",
    "tenue": "El platillo sigue en su lugar, pero todo el renglón se ve muy clarito, casi transparente, con «Se acabó».",
    "oculto": "El platillo desaparece del menú hasta mañana.",
}
PIZARRON = {
    "borrar": "Lo borro del pizarrón o del letrero.",
    "tachar": "Le pongo una raya encima.",
    "letrero": "Le escribo al lado «se acabó» o «agotado».",
    "nada": "No cambio nada y lo digo cuando me preguntan.",
}
SEGUNDO_NEGOCIO = {
    "cambiar": "Una sola cuenta con tu correo: tocas el nombre de tu negocio arriba y cambias al otro, como en Instagram cuando tienes dos cuentas. Cada negocio tiene su propio nombre, menú, seguidores y reseñas.",
    "separadas": "Una cuenta aparte para cada negocio, con otro correo; cierras sesión para pasar de uno al otro.",
    "juntos": "Un solo perfil que junta los dos negocios con un solo nombre y un solo menú.",
}
SUCURSALES = {
    "mismo": "Un solo menú del día que sale igual en todas tus sucursales.",
    "cada_una": "Cada sucursal publica su propio menú del día.",
    "elegir": "Un solo menú y, al publicar, eliges en qué sucursales sale; si una tiene algo distinto, le cambias solo eso.",
}
PRO = {
    "por_cuenta": "Un solo pago de Pro cubre todos tus negocios.",
    "por_negocio": "Cada negocio paga su propio Pro.",
    "descuento": "El primer negocio paga Pro completo y los demás con descuento.",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def escalas(persona, preguntas):
    return preguntar({"app": APP}, {k: {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. {q}"}
                                     for k, q in preguntas.items()})

def leer_foodie(p, persona):
    base = sum(map(ord, p))
    return p, {
        "entiende": elegir(persona, AGOTADO, "Son la 1:30 y abres el menú de hoy de una fonda; el mole verde ya se acabó. ¿Con cuál de las `opciones` entiendes más rápido qué hay y qué ya no?", base + 1),
        "leer": elegir(persona, AGOTADO, "Quieres saber qué era el platillo que se acabó para pedirlo otro día. ¿Con cuál de las `opciones` lo lees mejor?", base + 2),
        "escalas": escalas(persona, {
            "raya_nunca": "Si en el menú de hoy ves el nombre de un platillo tachado con una raya, ¿qué tanto piensas que ese platillo ya no lo venden nunca?",
            "raya_cuesta": "¿Qué tanto te cuesta leer un nombre tachado con una raya encima en el celular?",
        }),
    }

def leer_negocio(p, persona):
    base = sum(map(ord, p))
    return p, {
        "pizarron": elegir(persona, PIZARRON, "Cuando se te acaba un guisado a media comida, ¿qué haces en tu pizarrón o letrero?", base + 1),
        "prefiere": elegir(persona, AGOTADO, "Marcas en la app que se acabó el mole verde. ¿Cómo prefieres que lo vean tus clientes?", base + 2),
        "segundo_negocio": elegir(persona, SEGUNDO_NEGOCIO, "Imagina que además de tu negocio abres otro con otro nombre (por ejemplo, unos tacos de noche). ¿Cómo prefieres manejar los dos en la app?", base + 3),
        "sucursales": elegir(persona, SUCURSALES, "Imagina que tu mismo negocio tiene dos sucursales. ¿Cómo prefieres publicar el menú del día?", base + 4),
        "pro": elegir(persona, PRO, "El plan Pro cuesta 99 pesos al mes y da avisos especiales a tus seguidores y más lecturas con foto. Si tuvieras dos negocios, ¿qué te parece más justo?", base + 5),
        "escalas": escalas(persona, {
            "verlo_igual": "¿Qué tanto te importa que tus clientes sigan viendo en el menú el platillo que se acabó, para que sepan que lo haces y vuelvan otro día?",
        }),
    }

def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        foodies = pool.map(lambda kv: leer_foodie(*kv), FOODIES.items())
        negocios = pool.map(lambda kv: leer_negocio(*kv), NEGOCIOS.items())
        crudo = {"app": APP, "opciones": {"agotado": AGOTADO, "pizarron": PIZARRON, "segundo_negocio": SEGUNDO_NEGOCIO,
                                         "sucursales": SUCURSALES, "pro": PRO},
                 "foodies": dict(foodies), "negocios": dict(negocios)}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for grupo in ("foodies", "negocios"):
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
