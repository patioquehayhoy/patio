#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe), 2026-11-24: auditoría panorámica de Patio y cuatro decisiones de Parco.

Negocios (el lado difícil):
  1. Cómo nombrar el menú que la gente ya puede ver hoy («Publicado hoy» y alternativas).
  2. Cuántas lecturas de menú con foto gratis al día.
  3. Qué tan probable es pagar Pro, o dejar la app, si se acaban 3 lecturas en un día.
  4. Qué tanto molesta registrarse con correo para publicar y ver sus números.
  5. Panorámica: lo que más les sirve y lo que más les cuesta de la app.
Comensales:
  6. Si se pide correo para ver el mapa.
  7. Panorámica: lo que más les sirve y lo que más les cuesta.
Uso: python3 docs/research/jev_auditoria_app_2026-11-24.py docs/research/jev-auditoria-app-2026-11-24.json
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

APP = ("Una app mexicana de celular donde fondas, cocinas económicas, taquerías y personas que venden comida en casa publican "
       "su menú del día, gratis. Escribir el menú a mano siempre es gratis; la app también puede leer el menú de una foto del "
       "pizarrón y escribirlo sola. Hay un plan Pro de $99 al mes. Quien busca dónde comer ve en el mapa los lugares cercanos "
       "con su menú de hoy.")
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
    "foraneo": "un estudiante de 21 años que llegó de Oaxaca a la CDMX",
    "vista": "un señor de 67 años que tiene la letra del celular en grande porque ya no ve bien de cerca",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

ETIQUETA = {
    "publicado_hoy": "Publicado hoy",
    "en_vivo": "En vivo",
    "menu_actual": "Menú actual",
    "lo_que_ven": "Lo que ven hoy",
}
LECTURAS = {
    "una": "1 lectura con foto al día gratis; con Pro, 30.",
    "tres": "3 lecturas con foto al día gratis; con Pro, 30.",
    "cinco": "5 lecturas con foto al día gratis; con Pro, 30.",
    "veinte": "20 lecturas con foto al día gratis; con Pro, 60.",
}
CUENTA_FOODIE = {
    "sin_cuenta": "Ver el mapa y los menús sin cuenta; el correo se pide solo para seguir lugares, guardar y reseñar.",
    "correo_inicio": "Pedir el correo desde el inicio, antes de ver el mapa.",
    "despues": "Dejar ver unas cuantas veces sin cuenta y luego pedir el correo para seguir usándola.",
}
NEGOCIO_PARTES = {
    "foto": "Que la app lea el menú de una foto del pizarrón.",
    "mano": "Escribir el menú a mano en la app.",
    "programar": "Dejar listo el menú de mañana para que salga solo.",
    "se_acabo": "Marcar en la app un platillo que se acabó.",
    "avisos": "Avisar a quien te sigue: «abrimos tarde» u «hoy no abro».",
    "hoy": "Ver cuántas personas vieron tu menú y lo que más gustó.",
    "resenas": "Leer y contestar reseñas.",
    "equipo": "Que tu hija o tu encargado publiquen con su propio correo.",
    "racha": "Ver cuántos días seguidos llevas publicando.",
}
FOODIE_PARTES = {
    "mapa": "Ver en el mapa qué lugares cercanos tienen menú hoy.",
    "buscar": "Buscar por platillo: «pozole», «chilaquiles».",
    "menu": "Abrir un lugar y ver su menú de hoy con precios.",
    "seguir": "Seguir un lugar y que te avise cuando publica.",
    "listas": "Guardar lugares en listas y compartirlas.",
    "resenas": "Leer y escribir reseñas con fotos.",
    "visitas": "Que la app note tus visitas para pedirte una calificación.",
}

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def escala(persona, pregunta):
    return preguntar({"app": APP}, {"r": {"type": "score", "criteria": GRADO,
                                           "instructions": f"Piensa como {persona}. {pregunta}"}})["r"]

def leer_negocio(p, persona):
    base = sum(map(ord, p))
    return p, {
        "etiqueta": elegir(persona, ETIQUETA, "En la lista de tus menús, arriba, sale el menú que la gente ya puede ver hoy en tu ficha. ¿Con cuál nombre lo entiendes más rápido?", base + 1),
        "lecturas": elegir(persona, LECTURAS, "¿Cuál te parece más justo para que la app lea tu menú de una foto?", base + 2),
        "sirve": elegir(persona, NEGOCIO_PARTES, "¿Qué es lo que más te sirve de la app?", base + 3),
        "cuesta": elegir(persona, NEGOCIO_PARTES, "¿Qué es lo que más te costaría usar o lo que menos entiendes?", base + 4),
        "escalas": {
            "paga_si_se_acaban": escala(persona, "Llevas 3 lecturas con foto hoy y se acabaron las gratis. ¿Qué tan probable es que pagues Pro de $99 al mes para seguir?"),
            "deja_si_se_acaban": escala(persona, "Llevas 3 lecturas con foto hoy y se acabaron las gratis. ¿Qué tan probable es que dejes de usar la app?"),
            "molesta_correo": escala(persona, "Para publicar tu menú y ver tus números, la app te pide tu correo y un código. ¿Qué tanto te molesta?"),
        },
    }

def leer_foodie(p, persona):
    base = sum(map(ord, p))
    return p, {
        "cuenta": elegir(persona, CUENTA_FOODIE, "¿Cuándo debería pedirte la app tu correo?", base + 1),
        "sirve": elegir(persona, FOODIE_PARTES, "¿Qué es lo que más te sirve de la app?", base + 2),
        "cuesta": elegir(persona, FOODIE_PARTES, "¿Qué es lo que menos usarías o menos entiendes?", base + 3),
        "escalas": {
            "deja_si_piden_correo": escala(persona, "Abres la app por primera vez y antes de ver el mapa te pide tu correo. ¿Qué tan probable es que la cierres?"),
        },
    }

def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        negocios = pool.map(lambda kv: leer_negocio(*kv), NEGOCIOS.items())
        foodies = pool.map(lambda kv: leer_foodie(*kv), FOODIES.items())
        crudo = {"app": APP, "opciones": {"etiqueta": ETIQUETA, "lecturas": LECTURAS, "negocio_partes": NEGOCIO_PARTES,
                                         "cuenta_foodie": CUENTA_FOODIE, "foodie_partes": FOODIE_PARTES},
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
