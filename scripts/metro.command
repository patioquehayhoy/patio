#!/bin/zsh
# Levanta Metro para la dev build de Patio (iPhone por WiFi).
# Uso: doble clic, o `open -a Terminal scripts/metro.command`.
cd /Users/parco/Patio || exit 1
exec npx expo start --dev-client --host lan
