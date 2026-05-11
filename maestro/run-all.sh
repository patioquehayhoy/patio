#!/bin/bash
# Corre todos los flows de Maestro y guarda screenshots en maestro/screenshots/
# Uso: ./maestro/run-all.sh
# Requiere: Java + ~/.maestro/bin/maestro instalado, simulador iOS corriendo con la app

set -e
MAESTRO=~/.maestro/bin/maestro
FLOWS_DIR="$(dirname "$0")/flows"
SCREENSHOTS_DIR="$(dirname "$0")/screenshots"

mkdir -p "$SCREENSHOTS_DIR"

echo "📱 Corriendo flows de Patio..."

for flow in "$FLOWS_DIR"/*.yaml; do
  name=$(basename "$flow" .yaml)
  echo "  → $name"
  $MAESTRO test "$flow" --format junit --output /tmp/maestro-report.xml 2>/dev/null || true
done

echo ""
echo "✅ Screenshots guardados en maestro/screenshots/"
echo "   $(ls "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') imágenes"
open "$SCREENSHOTS_DIR"
