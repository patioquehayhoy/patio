#!/usr/bin/env python3
"""
Redimensiona screenshots a 1284x2778px para App Store.
Fondo: #F5E9D9, imagen original centrada.
"""

from pathlib import Path
from PIL import Image

TARGET_W = 1284
TARGET_H = 2778
BG_COLOR = (245, 233, 217)  # #F5E9D9

JOBS = [
    (
        Path.home() / 'Desktop/screenshots-appstore/vHueso',
        Path.home() / 'Desktop/screenshots-appstore/vHueso-final',
    ),
    (
        Path.home() / 'Desktop/screenshots-appstore/vAzul',
        Path.home() / 'Desktop/screenshots-appstore/vAzul-final',
    ),
]

for src_dir, dst_dir in JOBS:
    if not src_dir.exists():
        print(f'⚠️  No existe: {src_dir}')
        continue

    dst_dir.mkdir(parents=True, exist_ok=True)
    pngs = sorted(src_dir.glob('*.png'))

    if not pngs:
        print(f'⚠️  Sin PNGs en: {src_dir}')
        continue

    print(f'\n{src_dir.name} → {dst_dir.name} ({len(pngs)} imágenes)')

    for png in pngs:
        img = Image.open(png).convert('RGBA')

        # Escalar manteniendo proporción para que quepa en el canvas
        img.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)

        canvas = Image.new('RGB', (TARGET_W, TARGET_H), BG_COLOR)

        x = (TARGET_W - img.width) // 2
        y = (TARGET_H - img.height) // 2

        # Pegar con máscara alpha si la tiene
        canvas.paste(img, (x, y), mask=img.split()[3] if img.mode == 'RGBA' else None)

        out_path = dst_dir / png.name
        canvas.save(out_path, 'PNG', optimize=True)
        print(f'  ✓ {png.name} → {img.width}×{img.height} centrada')

print('\nListo.')
