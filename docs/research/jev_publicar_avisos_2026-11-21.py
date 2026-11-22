#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): el aviso diario de publicar y sus casos (2026-11-21).
Solo negocios (el lado difícil). Solo texto.
1. Ignorar el aviso varios días: seguir diario, pausar y preguntar, o semanal.
2. Publicar ya tarde (después de cerrar): avisar o no a quienes te siguen.
3. Menú que casi no cambia: abrir el editor, un toque «mismo menú», o sin aviso.
4. Cuándo llega «N personas vieron tu menú».
5. Un día que normalmente abres y hoy no: qué te sirve desde el aviso.
6. Publicar la noche anterior el menú de mañana (escala).
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
       "su menú del día; la gente cercana lo ve en un mapa y va al lugar, y quienes siguen el lugar reciben un aviso cuando publica. "
       "La app le manda al negocio un aviso «¿Ya publicaste lo de hoy?» una hora antes de abrir, solo los días que abre y que aún no publica. "
       "Al tocarlo se abre su último menú ya escrito: cambia lo que no hay y toca «Publicar».")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX; cambia los guisados cada día y cocina desde las 8 de la mañana",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas; escribe el menú rápido antes de abrir, con prisa, y a veces se le olvida",
    "cocina": "un hombre de 34 años con una cocina económica y dos empleados que quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos; algunos días no cocina",
    "taquero": "un taquero de 38 años con una taquería en Iztapalapa; su menú es casi siempre el mismo",
    "desayunos": "un señor de 60 años con un puesto de desayunos y jugos que abre a las 7 de la mañana",
}

IGNORAR = {
    "diario": "Si pasan 3 días que abres y no publicas, el aviso sigue llegando cada día igual.",
    "pausa": "Si pasan 3 días que abres y no publicas, el aviso deja de llegar diario y te pregunta una sola vez si quieres seguir recibiéndolo.",
    "semanal": "Si pasan 3 días que abres y no publicas, el aviso pasa a llegar solo una vez por semana.",
}
TARDE = {
    "avisar": "Si publicas tu menú cuando ya cerraste, a quienes te siguen les llega el aviso «Publicó su menú de hoy» igual.",
    "no_avisar": "Si publicas tu menú cuando ya cerraste, tu menú queda en la app pero a quienes te siguen no les llega aviso (llegarían a un lugar cerrado).",
    "preguntar": "Si publicas tu menú cuando ya cerraste, la app te pregunta si quieres avisar a quienes te siguen.",
}
FIJO = {
    "editor": "Aunque tu menú casi no cambie, el aviso abre tu último menú para que lo revises y toques «Publicar».",
    "un_toque": "Si tu menú casi no cambia, el aviso trae un botón «Abrí hoy, mismo menú» que lo publica sin abrir la app.",
    "sin_aviso": "Si tu menú casi no cambia, no hay aviso diario: tu menú se queda puesto y solo lo cambias cuando quieras.",
}
RESUMEN = {
    "tarde": "El aviso «Hoy 37 personas vieron tu menú» llega a las 6 de la tarde, después de la comida.",
    "noche": "El aviso «Hoy 37 personas vieron tu menú» llega a las 9 de la noche.",
    "manana": "El aviso «Ayer 37 personas vieron tu menú» llega a la mañana siguiente, junto con «¿Ya publicaste lo de hoy?».",
}
CIERRE = {
    "nada": "Si hoy no abres, ignoras el aviso y ya.",
    "hoy_no_abro": "El aviso trae un botón «Hoy no abro»: deja de avisarte hoy y a quienes te siguen les aparece que hoy no abriste.",
    "pausar_dias": "El aviso trae «Pausar unos días» para cuando sales de vacaciones o te enfermas, y la app no te avisa hasta que regreses.",
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
        "ignorar": elegir(persona, IGNORAR, "Una semana estás muy ocupada y no publicas tres días. ¿Con cuál de las `opciones` seguirías usando la app sin que te harte?", base + 1),
        "tarde": elegir(persona, TARDE, "Hoy se te pasó y publicas en la noche, ya cerrado. ¿Cuál de las `opciones` prefieres?", base + 2),
        "fijo": elegir(persona, FIJO, "Piensa en los días en que tu menú es igual al de ayer. ¿Cuál de las `opciones` te quita menos tiempo sin que la gente vea algo equivocado?", base + 3),
        "resumen": elegir(persona, RESUMEN, "¿Cuál de las `opciones` te daría más ganas de volver a publicar mañana?", base + 4),
        "cierre": elegir(persona, CIERRE, "Hay días que normalmente abres pero hoy no (te enfermaste, una fiesta, no hubo gas). ¿Cuál de las `opciones` te sirve más?", base + 5),
        "escalas": preguntar({"app": APP}, {
            "noche_anterior": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te gustaría publicar en la noche el menú de mañana, para que salga solo al día siguiente?"},
            "aviso_diario_cansa": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Un aviso diario «¿Ya publicaste lo de hoy?», solo los días que abres y no has publicado, ¿qué tanto te cansaría con el tiempo?"},
            "publicaria_mas": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si al tocar el aviso se abre tu último menú ya escrito y solo cambias lo que no hay, ¿qué tanto publicarías más seguido?"},
            "cambiar_a_medio_dia": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te importa poder marcar a media comida que algo ya se acabó?"},
        }),
    }

def main():
    with ThreadPoolExecutor(max_workers=6) as pool:
        crudo = {"app": APP, "negocios": dict(pool.map(lambda kv: leer(*kv), NEGOCIOS.items()))}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")

    def ch(x): return f"{x['choice']} {({a: round(b, 2) for a, b in x['probabilities'].items()})}"
    totales = {}
    for p, r in crudo["negocios"].items():
        print(f"\n{p}")
        for k, v in r.items():
            if k == "escalas":
                print("  escalas:", {n: round(x["score"], 2) for n, x in v.items()})
                continue
            print(f"  {k}: {ch(v)}")
            for opcion, prob in v["probabilities"].items():
                totales.setdefault(k, {}).setdefault(opcion, []).append(prob)
    print("\nPromedio por pregunta:")
    for k, opciones in totales.items():
        print(f"  {k}: {({o: round(sum(ps) / len(ps), 2) for o, ps in opciones.items()})}")

main()
