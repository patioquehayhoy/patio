#!/usr/bin/env python3
"""Jev mira fotos de menús y las clasifica (2026-11-15).

Mismo camino que la capa visual de SYSTEMA Lab: Jev 1.14 con imágenes (beta)
responde preguntas cerradas sobre cada foto. Sirve para cientos de fotos a
costo casi cero y con probabilidad en cada respuesta; la lectura exacta de
platillos y precios se hace aparte, en una muestra, con el lector de Patio.

Uso:
  TYPESAFE_API_KEY=… python3 docs/research/menus_jev_clasificar_2026-11-15.py salida.json foto1.jpg [foto2.jpg …]
"""
import base64, io, json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

MODEL = "jev-1.14.0"

def choice(instructions, criteria): return {"type": "choice", "instructions": instructions, "criteria": criteria}
def si_no(instructions): return {"type": "noul", "instructions": instructions}

PREGUNTAS = {
    "es_menu": si_no("¿`foto` muestra un menú de comida: una lista de platillos, con o sin precios?"),
    "formato": choice("¿Cómo está hecho el menú de `foto`?", {
        "pizarron": "Pizarrón o pizarra escrita a mano con gis o plumón",
        "hoja": "Hoja, cartulina o papel escrito a mano",
        "impreso": "Menú impreso: carta, tríptico, lona o cartel impreso",
        "digital": "Imagen hecha en celular o computadora (diseño, post o captura)",
        "platillos": "Solo fotos de platillos, sin lista de platillos",
        "otro": "Ninguna de las anteriores",
    }),
    # Calibrado con el pizarrón real de Parco (15 nov): preguntado en abstracto
    # («¿cómo se cobra la comida corrida?») Jev dijo «ninguno» (0.62); con lo
    # que se ve escrito («MENÚ $100») acierta (0.93). Preguntar lo visible.
    "precio_menu": choice("En `foto`, ¿hay un precio escrito en el encabezado del menú del día (junto a «MENÚ», «MENÚ DEL DÍA», «COMIDA CORRIDA» o «COMIDA») que cubre todo lo que va abajo?", {
        "uno": "Sí, un solo precio en ese encabezado (por ejemplo «MENÚ $100»)",
        "varios": "Sí, varios precios para el menú (por ejemplo completo $95, sin sopa $85, solo guisado $70)",
        # Del piloto (revisión a mano, 15 nov): dos formas que Jev contaba como «ninguno».
        "dos_menus": "Hay dos o más menús, cada uno con su precio en su encabezado (por ejemplo «MENÚ DEL DÍA $120» y «MENÚ EJECUTIVO $140»)",
        "por_guisado": "No hay precio en el encabezado: el precio va junto a cada guisado o plato fuerte y la sopa y el arroz van incluidos",
        "ninguno": "No, el menú del día no tiene un precio en su encabezado",
    }),
    "carta": choice("¿Hay en `foto` una carta («a la carta») aparte del menú del día?", {
        "precio_comun": "Sí, con un precio común para la carta (por ejemplo «CARTA $110»)",
        "por_platillo": "Sí, y cada platillo de la carta tiene su propio precio",
        "sin_precio": "Sí, pero sin precios",
        "no": "No hay carta aparte",
    }),
    "excepciones": si_no("¿En `foto` hay platillos con precio propio distinto al precio común de su bloque (por ejemplo arrachera $150 en una carta de $110)?"),
    # Calibrado con el pizarrón: «¿está organizado por tiempos?» daba 0.28–0.51
    # (ambiguo); preguntado por lo que se dibuja, acierta (llaves 0.72,
    # encabezados 0.20 en un pizarrón sin encabezados). «Por tiempos» = alguna de las dos.
    "llaves": si_no("¿En `foto` hay llaves o corchetes dibujados («{», «<», «(») que juntan dos o más platillos como opciones de un mismo grupo?"),
    "encabezados_tiempos": si_no("¿En `foto` hay encabezados de tiempos o grupos escritos (por ejemplo «SOPAS», «PRIMER TIEMPO», «GUISADOS», «PLATO FUERTE») en el menú del día?"),
    "incluye_bebida_postre": si_no("¿`foto` dice que el menú incluye agua, bebida o postre?"),
    "es_platillo": si_no("¿`foto` es una fotografía de comida servida (un platillo en plato, taco, sopa) como protagonista, sin lista de menú?"),
    "fotos_platillos": si_no("¿`foto` incluye fotografías de los platillos además de la lista?"),
    "fecha": si_no("¿`foto` dice el día o la fecha del menú?"),
    "legible": {"type": "score", "instructions": "¿Qué tan legibles son los platillos y precios en `foto`?",
                "criteria": ["Nada legible.", "Poco legible.", "A medias.", "Bastante legible.", "Del todo legible."]},
}

def jpg_1024(ruta: Path) -> str:
    # Jev pide el lado largo a 1024 px (como la capa visual): las chicas se
    # rechazan («Invalid image dimensions»), así que también se agrandan.
    img = Image.open(ruta).convert("RGB")
    escala = 1024 / max(img.size)
    img = img.resize((max(1, round(img.size[0] * escala)), max(1, round(img.size[1] * escala))), Image.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, "JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode()

def clasificar(ruta: Path):
    try:
        return pregunta_a_jev(ruta)
    except Exception as error:  # una foto rota no tumba el lote
        return str(ruta), {"error": str(error)[:200]}

def pregunta_a_jev(ruta: Path):
    data = jpg_1024(ruta)
    body = {"model": MODEL, "state": {"foto": "foto-1"}, "questions": PREGUNTAS,
            "assets": {"foto-1": {"type": "image", "format": "jpg", "data_base64": data}}}
    req = urllib.request.Request("https://api.typesafe.ai/v1/systemone", data=json.dumps(body).encode(), headers={
        "Authorization": f"Bearer {os.environ['TYPESAFE_API_KEY']}", "Content-Type": "application/json",
        "TypeSafe-Danger-Zone-Images": "true"})
    answers = json.load(urllib.request.urlopen(req, timeout=180))["answers"]
    out = {}
    for k, q in PREGUNTAS.items():
        a = answers[k]
        if q["type"] == "noul": out[k] = {"si": a["noul"] >= 0.5, "p": round(a["noul"], 2)}
        elif q["type"] == "score": out[k] = round(a["score"], 2)
        else: out[k] = {"es": a["choice"], "p": {c: round(v, 2) for c, v in a["probabilities"].items()}}
    return str(ruta), out

def main():
    salida = Path(sys.argv[1])
    # Acepta fotos o carpetas (se recorren completas). Lo ya clasificado en
    # `salida` no se vuelve a preguntar: se puede cortar y seguir.
    fotos = []
    for arg in sys.argv[2:]:
        ruta = Path(arg)
        fotos += sorted(ruta.rglob("*.jpg")) if ruta.is_dir() else [ruta]
    previos = json.loads(salida.read_text(encoding="utf-8")) if salida.exists() else {}
    hechos = {k for k, v in previos.items() if "error" not in v}
    fotos = [f for f in fotos if str(f) not in hechos]
    print(f"{len(fotos)} fotos por clasificar ({len(hechos)} ya estaban)")
    resultados = dict(previos)
    with ThreadPoolExecutor(4) as pool:
        for n, (ruta, r) in enumerate(pool.map(clasificar, fotos), 1):
            resultados[ruta] = r
            if n % 25 == 0:  # guarda seguido
                salida.write_text(json.dumps(resultados, indent=1, ensure_ascii=False), encoding="utf-8")
                print(f"  {n}/{len(fotos)}")
    salida.write_text(json.dumps(resultados, indent=1, ensure_ascii=False), encoding="utf-8")
    if len(fotos) > 5:
        return
    for ruta, r in resultados.items():
        print("\n" + ruta)
        for k, v in r.items(): print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
