export type AppVariant = 'consumer' | 'merchant' | 'driver';

const rawVariant = process.env.EXPO_PUBLIC_APP_VARIANT;
export const APP_VARIANT: AppVariant = rawVariant === 'merchant' || rawVariant === 'driver' ? rawVariant : 'consumer';

export const APP_HOME = APP_VARIANT === 'merchant' ? '/seller' : APP_VARIANT === 'driver' ? '/driver' : '/(tabs)';
export const APP_NAME = APP_VARIANT === 'merchant' ? 'RasaLokal Mitra' : APP_VARIANT === 'driver' ? 'RasaLokal Driver' : 'RasaLokal';
export const IS_CONSUMER = APP_VARIANT === 'consumer';
export const IS_MERCHANT = APP_VARIANT === 'merchant';
export const IS_DRIVER = APP_VARIANT === 'driver';
