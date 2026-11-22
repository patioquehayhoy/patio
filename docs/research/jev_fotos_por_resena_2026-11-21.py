#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): ¿cuántas fotos por reseña? (2026-11-21).
Hoy cada reseña (una visita) lleva una sola foto de un platillo; se puede
reseñar el mismo lugar una vez al día. Opciones: una, hasta 5 (cada una con su
platillo) o hasta 5 con el platillo opcional.
Foodies (quien sube y quien mira) y dos negocios (quien recibe las fotos).
Solo texto."""
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
       "su menú del día; la gente cercana lo ve en un mapa y va al lugar. Después de comer, quien fue puede dejar una reseña "
       "(estrellas y unas palabras) y una foto de lo que comió. Cada foto se marca con el platillo del menú al que pertenece, "
       "y en la ficha del lugar, al tocar un platillo, salen las fotos de ese platillo que subieron los clientes. "
       "Se puede reseñar el mismo lugar una vez al día.")
PERSONAS = {
    "oficinista": ("foodie", "una oficinista de 31 años en la colonia Roma que come diario en fondas cerca de su trabajo y tiene 40 minutos para comer"),
    "estudiante": ("foodie", "un estudiante de 22 años que busca comida barata cerca de CU y sube fotos de todo lo que come a sus historias"),
    "papa": ("foodie", "un papá de 44 años que lleva a su familia a comer los domingos y pide varios platillos para compartir"),
    "jubilada": ("foodie", "una señora jubilada de 66 años que usa poco el celular y va siempre a la misma fonda"),
    "foodie": ("foodie", "una mujer de 28 años que busca fondas escondidas y quiere ver bien la comida antes de ir"),
    "fondera": ("negocio", "una señora de 52 años dueña de una fonda de comida corrida en la Narvarte; las fotos de sus clientes salen en su ficha"),
    "taquero": ("negocio", "un taquero de 38 años en Iztapalapa; cada taco tiene su precio y sus clientes suben fotos"),
}

CUANTAS = {
    "una": "Cada reseña lleva una sola foto, de un platillo. Si vuelves otro día y comes otra cosa, subes otra foto con otra reseña.",
    "varias": "Cada reseña lleva hasta 5 fotos; a cada foto le dices de qué platillo es.",
    "varias_libre": "Cada reseña lleva hasta 5 fotos; decir de qué platillo es cada una es opcional (puedes no marcar ninguna).",
}
VER = {
    "una_por_persona": "Al tocar un platillo, salen primero las fotos de personas distintas (una de cada quien) y después las demás.",
    "recientes": "Al tocar un platillo, salen las fotos más recientes primero, aunque varias sean de la misma persona.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def elegir(persona, opciones, pregunta, seed):
    orden = list(opciones); random.Random(seed).shuffle(orden)
    return preguntar({"app": APP, "opciones": {k: opciones[k] for k in orden}}, {
        "elige": {"type": "choice", "criteria": {k: f"`opciones.{k}`" for k in orden},
                  "instructions": f"Piensa como {persona}. {pregunta}"}})["elige"]

def leer(clave, rol_persona):
    rol, persona = rol_persona
    base = sum(map(ord, clave))
    if rol == "foodie":
        cuantas = "Acabas de comer sopa, guisado y agua de horchata. ¿Con cuál de las `opciones` sí dejarías tu reseña con fotos, sin que te dé flojera?"
    else:
        cuantas = "Tus clientes suben fotos de tu comida a tu ficha. ¿Con cuál de las `opciones` crees que tu comida se vería mejor y más fiel a como es?"
    r = {
        "cuantas": elegir(persona, CUANTAS, cuantas, base + 1),
        "ver": elegir(persona, VER, "Quieres saber cómo se ve el mole de un lugar antes de ir (o cómo ven tu mole quienes no han ido). ¿Cuál de las `opciones` te da una idea más fiel?", base + 2),
    }
    escalas = {
        "una_basta": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si solo pudieras subir una foto por visita, ¿qué tanto te bastaría?"},
        "marcar_platillo": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. ¿Qué tanto te importa que cada foto diga de qué platillo es, aunque cueste un toque más por foto?"},
    }
    if rol == "foodie":
        escalas["dejaria_de_subir"] = {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si solo se permite una foto por visita, ¿qué tanto dejarías de subir fotos?"}
    else:
        escalas["miedo_spam"] = {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si un cliente puede subir 5 fotos por visita, ¿qué tanto te preocupa que una sola persona llene tu ficha con fotos malas?"}
    r["escalas"] = preguntar({"app": APP}, escalas)
    return clave, {"rol": rol, **r}

def main():
    with ThreadPoolExecutor(max_workers=7) as pool:
        crudo = {"app": APP, "personas": dict(pool.map(lambda kv: leer(*kv), PERSONAS.items()))}
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
