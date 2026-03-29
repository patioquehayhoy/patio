import glob
import os
from PIL import Image

BG_COLOR = (239, 239, 239)  # #EFEFEF
TARGET_SIZE = (1284, 2778)
INPUT_GLOB = os.path.expanduser("~/Desktop/Simulator Screenshot*.png")
OUTPUT_DIR = os.path.expanduser("~/Desktop/screenshots-appstore")

os.makedirs(OUTPUT_DIR, exist_ok=True)

files = sorted(glob.glob(INPUT_GLOB))
if not files:
    print("No se encontraron archivos.")
    exit(1)

for path in files:
    img = Image.open(path).convert("RGBA")

    # Escalar manteniendo proporción para que quepa en el target
    scale = min(TARGET_SIZE[0] / img.width, TARGET_SIZE[1] / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    bg = Image.new("RGB", TARGET_SIZE, BG_COLOR)
    x = (TARGET_SIZE[0] - new_w) // 2
    y = (TARGET_SIZE[1] - new_h) // 2
    bg.paste(img, (x, y), img)

    filename = os.path.basename(path)
    out_path = os.path.join(OUTPUT_DIR, filename)
    bg.save(out_path)
    print(f"✓ {filename} → {new_w}x{new_h}px centrado en {TARGET_SIZE[0]}x{TARGET_SIZE[1]}px")

print(f"\n{len(files)} archivos guardados en {OUTPUT_DIR}")
