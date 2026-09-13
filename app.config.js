const { existsSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const projectRoot = dirname(require.resolve('./app.json'));

/**
 * Native client configuration comes from the selected EAS environment.
 * Maps keys are embedded in Android binaries: restrict them by package + SHA-1
 * in Google Cloud. Firebase service-account credentials never belong here.
 */
module.exports = ({ config }) => {
  const mapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();
  const productionAndroid = process.env.EAS_BUILD_PROFILE === 'production'
    && process.env.EAS_BUILD_PLATFORM === 'android';

  if (productionAndroid && !mapsApiKey) {
    throw new Error('Android production requiere GOOGLE_MAPS_ANDROID_API_KEY en el entorno EAS production.');
  }
  if (productionAndroid && !googleServicesFile) {
    throw new Error('Android production requiere GOOGLE_SERVICES_JSON (variable EAS de tipo archivo para Firebase).');
  }
  if (productionAndroid && !existsSync(resolve(projectRoot, googleServicesFile))) {
    throw new Error('El archivo indicado por GOOGLE_SERVICES_JSON no existe. Revisa la variable de archivo en EAS.');
  }

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      ...(mapsApiKey ? {
        config: {
          ...config.android?.config,
          googleMaps: {
            ...config.android?.config?.googleMaps,
            apiKey: mapsApiKey,
          },
        },
      } : {}),
    },
  };
};
