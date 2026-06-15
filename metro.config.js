// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// `design-source/` guarda exports de Figma Make (proyecto web Vite/React, NO React Native).
// Es material de diseño de referencia — nunca debe entrar al bundle de la app.
// Ver design-source/README.md.
config.resolver.blockList = [/design-source\/.*/];

module.exports = config;
