// Igual que la configuración por defecto de Expo, más la redirección de Text/TextInput
// a components/app-text (fuente de interfaz en toda la app).
const presetExpo = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [presetExpo],
    plugins: ['./scripts/babel/app-text-imports.js'],
  };
};
