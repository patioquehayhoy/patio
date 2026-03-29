from PIL import Image

BG_COLOR = (239, 239, 239)  # #EFEFEF
OUTPUT_SIZE = (1024, 500)
LOGO_WIDTH_PCT = 0.40

bg = Image.new("RGB", OUTPUT_SIZE, BG_COLOR)

logo = Image.open("assets/images/logo-negro.png").convert("RGBA")

target_width = int(OUTPUT_SIZE[0] * LOGO_WIDTH_PCT)
ratio = target_width / logo.width
target_height = int(logo.height * ratio)
logo = logo.resize((target_width, target_height), Image.LANCZOS)

x = (OUTPUT_SIZE[0] - target_width) // 2
y = (OUTPUT_SIZE[1] - target_height) // 2

bg.paste(logo, (x, y), logo)
bg.save("assets/images/feature-graphic.png")
print(f"Generado: assets/images/feature-graphic.png ({OUTPUT_SIZE[0]}x{OUTPUT_SIZE[1]}px, logo {target_width}x{target_height}px)")
