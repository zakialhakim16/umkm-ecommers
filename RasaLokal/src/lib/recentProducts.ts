import AsyncStorage from '@react-native-async-storage/async-storage';
import { mergeRecentProduct } from '@/lib/discovery';

const KEY = 'rasalokal:recent-products:v1';
let pending: Promise<void> = Promise.resolve();

// Only public product IDs are stored locally; account and order data are not cached here.
export async function loadRecentProducts(): Promise<string[]> {
  try {
    const value: unknown = JSON.parse(await AsyncStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(0, 12) : [];
  } catch { return []; }
}

export function recordRecentProduct(productId: string): Promise<void> {
  pending = pending.then(async () => {
    const ids = await loadRecentProducts();
    await AsyncStorage.setItem(KEY, JSON.stringify(mergeRecentProduct(ids, productId)));
  }).catch(() => { /* Browsing remains available when device storage is full. */ });
  return pending;
}

export async function clearRecentProducts(): Promise<void> {
  await pending;
  await AsyncStorage.removeItem(KEY);
}
