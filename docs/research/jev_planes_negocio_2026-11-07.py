#!/usr/bin/env python3
"""Lectura de Jev (TypeSafe) sobre cómo presentar los planes del negocio en Patio (técnicas tipo Higgsfield vs. libro). Solo texto."""
import json, os, random, sys, urllib.request
from pathlib import Path

OUT = Path(sys.argv[1])

def preguntar(state, questions):
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone",
        data=json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode(),
        headers={"Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))["answers"]

APP = ("Una app mexicana de celular donde las fondas, cocinas económicas y personas que venden comida en casa publican su menú del día "
       "tomándole una foto; la app lee la foto y arma el menú. La gente cercana lo ve en un mapa, sigue sus lugares y recibe aviso "
       "cuando publican. Publicar, compartir el menú como imagen y avisar a tus seguidores es gratis. Hay un plan de pago opcional, Pro, "
       "que da más lecturas con foto al día, avisos especiales (promociones), un platillo destacado en tu ficha y saber a qué hora hay más interés.")
PERSONAS = {
    "fondera": "una señora de 52 años dueña de una fonda de comida corrida en la colonia Narvarte, CDMX; usa WhatsApp y Facebook todos los días",
    "cocina": "un hombre de 34 años que tiene una cocina económica con dos empleados y quiere atraer oficinistas",
    "casa": "una mujer de 29 años que vende comida desde su casa por WhatsApp a vecinos de su edificio",
}
OPCIONES = {
    "a": "Pro cuesta $99 al mes o $990 al año (se muestra como $83 al mes, «ahorras 2 meses»). El anual viene seleccionado.",
    "b": "Pro tiene 30 días gratis al empezar; después $99 al mes. Se cancela cuando quieras.",
    "c": "Sin mensualidad: compras paquetes de lecturas con foto y de avisos especiales cuando los necesites (por ejemplo 10 avisos por $49).",
    "d": "Los primeros negocios de tu colonia reciben Pro gratis 6 meses como Fundadores, con un sello en su ficha; después $99 al mes.",
    "e": "Pro cuesta $99 al mes, con una oferta por tiempo limitado: $49 el primer mes si te suscribes esta semana, con reloj de cuenta regresiva.",
}
GRADO = ["Nada.", "Poco.", "A medias.", "Bastante.", "Del todo."]

def main():
    crudo = {"app": APP, "opciones": OPCIONES, "por_opcion": {}, "elecciones": {}}
    random.seed(20261107)
    for p, persona in PERSONAS.items():
        crudo["por_opcion"][p] = {}
        for k, opcion in OPCIONES.items():
            crudo["por_opcion"][p][k] = preguntar({"app": APP, "opcion": opcion}, {
                "pagaria": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si el plan se ofreciera así: `opcion`, ¿qué tan probable es que lo pagaras en algún momento?"},
                "confia": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si el plan se ofreciera así: `opcion`, ¿qué tanta confianza te daría la app?"},
                "presion": {"type": "score", "criteria": GRADO, "instructions": f"Piensa como {persona}. Si el plan se ofreciera así: `opcion`, ¿qué tan presionada o engañada te sentirías?"},
            })
        crudo["elecciones"][p] = []
        for _ in range(3):
            orden = list(OPCIONES); random.shuffle(orden)
            crudo["elecciones"][p].append({"orden": orden, "respuesta": preguntar(
                {"app": APP, "opciones": {k: OPCIONES[k] for k in orden}},
                {"elige": {"type": "choice", "criteria": {k: f"La opción `opciones.{k}`." for k in orden},
                           "instructions": f"Piensa como {persona}. ¿Cuál de las `opciones` te haría seguir publicando en la app y, llegado el momento, pagar Pro?"}})})
    OUT.write_text(json.dumps(crudo, indent=1, ensure_ascii=False), encoding="utf-8")
    for p in PERSONAS:
        print(f"\n{p}: opción  pagaría  confía  presión")
        for k, a in crudo["por_opcion"][p].items():
            print(f"  {k:6}{a['pagaria']['score']:9.2f}{a['confia']['score']:8.2f}{a['presion']['score']:9.2f}")
        for e in crudo["elecciones"][p]:
            r = e["respuesta"]["elige"]
            print("  elige:", r["choice"], f"conf {r['confidence']:.2f}", {k: round(x, 2) for k, x in r["probabilities"].items()})

main()
