import baseConfig from './app.json';

type Variant = 'consumer' | 'merchant' | 'driver';
const variant = (['merchant','driver'].includes(process.env.EXPO_PUBLIC_APP_VARIANT ?? '') ? process.env.EXPO_PUBLIC_APP_VARIANT : 'consumer') as Variant;
const identity = {
  consumer: { name:'RasaLokal',slug:'rasalokal-consumer',scheme:'rasalokal',bundle:'id.rasalokal.consumer' },
  merchant: { name:'RasaLokal Mitra',slug:'rasalokal-mitra',scheme:'rasalokal-mitra',bundle:'id.rasalokal.mitra' },
  driver: { name:'RasaLokal Driver',slug:'rasalokal-driver',scheme:'rasalokal-driver',bundle:'id.rasalokal.driver' },
}[variant];

export default {
  ...baseConfig.expo,
  name:identity.name,slug:identity.slug,scheme:identity.scheme,
  ios:{...baseConfig.expo.ios,bundleIdentifier:identity.bundle},
  android:{...baseConfig.expo.android,package:identity.bundle},
  extra:{appVariant:variant},
};
