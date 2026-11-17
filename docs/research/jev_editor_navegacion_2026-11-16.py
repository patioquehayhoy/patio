#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe): editor del menú y pestaña del negocio (2026-11-16).
1. Cerrar el editor: «×», flecha de regresar o «Listo».
2. «siguiente» del teclado después del nombre de un platillo: renglón nuevo,
   descripción o precio.
3. Mover y borrar platillos: mantener presionado y arrastrar, un modo «Ordenar»
   con manijas y botón para borrar, o deslizar para borrar.
4. La última pestaña del negocio: «Ajustes», «Perfil» con la ficha pública, o
   «Perfil» con los ajustes (como hoy).
Solo negocios. Solo texto."""
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
       "su menú del día y su carta; la gente cercana lo ve en un mapa y va al lugar. El negocio escribe su menú en una pantalla "
       "donde cada sección (por ejemplo SOPAS, GUISADOS, POSTRES) es una tarjeta, y cada platillo tiene su foto a la izquierda, "
       "su nombre, una descripción debajo y su precio a la derecha. Al final de cada tarjeta hay un botón «＋ Platillo».")
NEGOCIOS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX; cambia los guisados cada día y casi nunca pone descripción ni precio por platillo",
    "callejon": "una mujer de 45 años con una cocina económica en un callejón junto a oficinas; escribe el menú rápido antes de abrir, con prisa",
    "cocina": "un hombre de 34 años con una cocina económica y dos empleados que quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
    "taquero": "un taquero de 38 años con una taquería en Iztapalapa; cada taco y cada bebida tiene su precio",
    "restaurantera": "una mujer de 41 años con un restaurante familiar con carta fija; le importa describir bien cada platillo",
}

CERRAR = {
    "tache": "Arriba a la izquierda hay una «×» para cerrar la pantalla del menú. Si cambiaste algo, pregunta si quieres guardarlo.",
    "regresar": "Arriba a la izquierda hay una flecha «‹» para regresar a la pantalla anterior. Si cambiaste algo, pregunta si quieres guardarlo.",
    "listo": "Arriba a la derecha hay un botón «Listo» que guarda lo que escribiste y cierra; no hay «×» ni flecha.",
}
SIGUIENTE = {
    "renglon": "Escribes el nombre de un platillo, tocas «siguiente» en el teclado y se abre un renglón nuevo para el siguiente platillo. La descripción y el precio los tocas aparte cuando los quieres.",
    "descripcion": "Escribes el nombre de un platillo, tocas «siguiente» y el cursor pasa a la descripción de ese mismo platillo; otro «siguiente» abre el platillo de abajo.",
    "precio": "Escribes el nombre de un platillo, tocas «siguiente» y el cursor pasa al precio de ese mismo platillo; otro «siguiente» abre el platillo de abajo.",
}
MOVER = {
    "arrastrar": "Para mover un platillo lo mantienes presionado y lo arrastras a donde va (también a otra sección). Para borrarlo, lo arrastras hasta arriba, donde dice «Borrar».",
    "ordenar": "Tocas «Ordenar» arriba: a cada platillo le sale a la izquierda un botón rojo para borrarlo y a la derecha unas rayitas para arrastrarlo a donde va. Al terminar tocas «Listo».",
    "deslizar": "Deslizas el platillo hacia la izquierda y aparece «Borrar». Para moverlo, lo mantienes presionado y lo arrastras.",
}
PESTANA = {
    "ajustes": "La última pestaña de abajo se llama «Ajustes» (un engrane) y ahí editas tu negocio, tu plan y tu cuenta. Tu ficha pública, como la ve la gente, está en la pestaña «Mi Patio».",
    "perfil_ficha": "La última pestaña de abajo se llama «Perfil» y muestra tu ficha pública tal como la ve la gente; arriba hay un engrane para editar tu negocio, tu plan y tu cuenta. Ya no hay pestaña «Mi Patio».",
    "perfil_ajustes": "La última pestaña de abajo se llama «Perfil» y ahí editas tu negocio, tu plan y tu cuenta. Tu ficha pública está en otra pestaña, «Mi Patio».",
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
        "cerrar": elegir(persona, CERRAR, "Estás escribiendo el menú de hoy. ¿Con cuál de las `opciones` te sentirías más segura o seguro de no perder lo que escribiste y de saber cómo salir?", base + 1),
        "siguiente": elegir(persona, SIGUIENTE, "Escribes tu menú en el celular. ¿Cuál de las `opciones` te ahorra más tiempo con tu menú de todos los días?", base + 2),
        "mover": elegir(persona, MOVER, "Ayer tenías mole y hoy no, y quieres pasar el bistec de GUISADOS a la carta. ¿Con cuál de las `opciones` lo harías más fácil y sin equivocarte?", base + 3),
        "pestana": elegir(persona, PESTANA, "En la barra de abajo de la app de tu negocio, ¿cuál de las `opciones` entiendes mejor a la primera?", base + 4),
        "escalas": preguntar({"app": APP}, {
            "agregar_otra_seccion": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Estás en SOPAS y te acuerdas de un guisado. ¿Qué tanto te queda claro que tocas «＋ Platillo» en la tarjeta de GUISADOS para agregarlo ahí?"},
            "vacios_en_gris": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si cada platillo muestra en gris «Descripción» y «$» mientras no los llenas, ¿qué tanto te ayuda a saber que puedes llenarlos sin que estorbe?"},
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
