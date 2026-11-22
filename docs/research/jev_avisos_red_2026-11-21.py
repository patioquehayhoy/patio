#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): avisos de la red, seguidores y ritmo de cada negocio (2026-11-21).
Foodies (quien recibe) y negocios (quien publica). Solo texto.
Foodies:
1. Sigues 40 lugares: un aviso por cada uno, un resumen, resumen + «cada vez» para los que elijas, o nada.
2. A qué hora el resumen.
3. Un lugar que sigues no abre hoy.
4. Promociones de los lugares que sigues.
Negocios:
5. A quién le llega cuando publicas.
6. Si tu menú casi nunca cambia (incluye «que se publique solo cada día a las 9»).
Escalas: qué se acabó, apagar avisos si llegan muchos, dejar listo en la noche.
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

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas, taquerías, postres y personas que venden comida en casa "
       "publican su menú del día; la gente cercana lo ve en un mapa y va al lugar. La gente puede seguir lugares y recibir avisos "
       "en el celular. Las fondas cambian su menú cada día; las taquerías y los postres casi nunca.")
FOODIES = {
    "oficinista": "una oficinista de 31 años en la colonia Roma que come diario fuera y decide a dónde ir como a las 12:30; sigue 40 lugares",
    "estudiante": "un estudiante de 22 años cerca de CU que busca comida barata; sigue 15 lugares y odia que el celular suene a cada rato",
    "papa": "un papá de 44 años que sale a comer con su familia los fines de semana; sigue 8 lugares",
    "jubilada": "una señora jubilada de 66 años que va casi siempre a la misma fonda; sigue 3 lugares",
    "foodie": "una mujer de 28 años que busca fondas escondidas y sigue 60 lugares",
}
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte; cambia los guisados cada día; 120 personas la siguen",
    "taquero": "un taquero de 38 años en Iztapalapa; su menú casi nunca cambia; 300 personas lo siguen",
    "postres": "una mujer de 35 años que vende postres y pasteles en su local; cambia de sabores cada mes; 80 personas la siguen",
}

SEGUIR = {
    "cada_uno": "Cada vez que uno de tus lugares publica su menú te llega un aviso, como máximo 3 al día (te llegan los primeros 3 que publican).",
    "resumen": "Te llega un solo aviso al mediodía con los que ya publicaron: «Fonda Lupita, Tacos El Güero y 5 más publicaron su menú de hoy».",
    "resumen_y_favoritos": "Te llega un solo aviso al mediodía con los que ya publicaron; además, al momento, solo de los pocos lugares que tú marcas «Avisarme cada vez».",
    "nada": "No te llegan avisos de tus lugares; lo ves cuando abres la app.",
}
HORA = {
    "once_y_media": "El resumen de tus lugares llega a las 11:30.",
    "doce_y_media": "El resumen de tus lugares llega a las 12:30.",
    "una_y_media": "El resumen de tus lugares llega a la 1:30.",
}
CERRADO = {
    "a_todos": "Si un lugar que sigues no abre hoy, te llega un aviso «Hoy no abrimos».",
    "en_la_app": "Si un lugar que sigues no abre hoy, no te llega aviso: en la app aparece que hoy no abre y no sale en tu resumen.",
    "solo_cada_vez": "Si un lugar que sigues no abre hoy, te llega aviso solo si lo marcaste «Avisarme cada vez»; si no, lo ves en la app.",
}
PROMO = {
    "todas": "Cada promoción de un lugar que sigues te llega como aviso al momento.",
    "una_al_dia": "Te llega como máximo una promoción al día, de cualquiera de tus lugares; las demás las ves en la app.",
    "en_resumen": "Las promociones no llegan solas: aparecen dentro del resumen del mediodía.",
}
PUBLICAR = {
    "aviso_a_todos": "Cuando publicas, a todos los que te siguen les llega un aviso con tu nombre al momento; pero quien sigue muchos lugares solo recibe los primeros 3 que publican cada día.",
    "resumen_y_cada_vez": "Cuando publicas, apareces con tu nombre en el resumen del mediodía de todos los que te siguen, junto con otros lugares; a quienes te marcaron «Avisarme cada vez» les llega al momento.",
    "solo_app": "Cuando publicas, no le llega aviso a nadie; te ven quienes abren la app.",
}
FIJO = {
    "cada_dia_igual": "Publicas tu menú cada día aunque sea igual, para que la gente vea que abriste.",
    "carta_siempre": "Tu carta se queda siempre visible los días que abres; solo publicas o avisas cuando hay algo nuevo (un sabor, un precio, una promoción).",
    "solo_a_las_9": "La app publica sola tu mismo menú cada día a las 9 de la mañana, sin que hagas nada.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def leer_foodie(p, persona):
    base = sum(map(ord, p))
    return p, {
        "rol": "foodie",
        "seguir": elegir(persona, SEGUIR, "¿Con cuál de las `opciones` seguirías teniendo prendidos los avisos de esta app dentro de tres meses?", base + 1),
        "hora": elegir(persona, HORA, "¿A qué hora te sirve más el resumen para decidir dónde comer?", base + 2),
        "cerrado": elegir(persona, CERRADO, "¿Cuál de las `opciones` prefieres?", base + 3),
        "promo": elegir(persona, PROMO, "Varios de tus lugares mandan promociones. ¿Cuál de las `opciones` prefieres?", base + 4),
        "escalas": preguntar({"app": APP}, {
            "se_acabo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te importa saber, antes de ir, que un platillo del menú de hoy ya se acabó?"},
            "apagaria": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si esta app te mandara 5 o más avisos de comida al día, ¿qué tanto apagarías todos sus avisos?"},
        }),
    }

def leer_negocio(p, persona):
    base = sum(map(ord, p))
    return p, {
        "rol": "negocio",
        "publicar": elegir(persona, PUBLICAR, "¿Con cuál de las `opciones` crees que más gente vendría a tu lugar a lo largo de los meses?", base + 5),
        "fijo": elegir(persona, FIJO, "Piensa en un negocio cuyo menú casi nunca cambia. ¿Cuál de las `opciones` es mejor para que la gente confíe en lo que ve en la app?", base + 6),
        "escalas": preguntar({"app": APP}, {
            "dejar_listo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te serviría dejar listo en la noche el menú de mañana y que salga solo a la hora que elijas?"},
            "se_acabo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto marcarías en la app, a media comida, un platillo que ya se acabó, si fuera deslizar el platillo y tocar «Se acabó»?"},
        }),
    }

def main():
    trabajos = [(leer_foodie, kv) for kv in FOODIES.items()] + [(leer_negocio, kv) for kv in NEGOCIOS.items()]
    with ThreadPoolExecutor(max_workers=8) as pool:
        crudo = {"app": APP, "personas": dict(pool.map(lambda job: job[0](*job[1]), trabajos))}
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")

    def ch(x): return f"{x['choice']} {({a: round(b, 2) for a, b in x['probabilities'].items()})}"
    totales = {}
    for p, r in crudo["personas"].items():
        print(f"\n{p} ({r['rol']})")
        for k, v in r.items():
            if k == "rol":
                continue
            if k == "escalas":
                print("  escalas:", {n: round(x["score"], 2) for n, x in v.items()})
                continue
            print(f"  {k}: {ch(v)}")
            for opcion, prob in v["probabilities"].items():
                totales.setdefault((r["rol"], k), {}).setdefault(opcion, []).append(prob)
    print("\nPromedio por pregunta:")
    for (rol, k), opciones in totales.items():
        print(f"  {rol} · {k}: {({o: round(sum(ps) / len(ps), 2) for o, ps in opciones.items()})}")

main()
