import type { CatalogProduct, Store } from './catalogStorage';

export type DiscoveryFilters = { category: string; maxPrice: number | null; openOnly: boolean; radiusKm: number | null };
export type DiscoverySort = 'recommended' | 'budget' | 'nearby';
export const DEFAULT_FILTERS: DiscoveryFilters = { category: 'Semua', maxPrice: null, openOnly: false, radiusKm: null };
export const FOOD_CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Camilan', 'Oleh-oleh'] as const;
export type RestaurantResult = { store: Store; products: CatalogProduct[]; minPrice: number; distanceKm: number | null };

export function buildRestaurantResults(
  stores: Store[], products: CatalogProduct[], filters: DiscoveryFilters, search: string,
  sort: DiscoverySort, distances: Record<string, number | null>,
): RestaurantResult[] {
  const query = search.trim().toLocaleLowerCase('id-ID');
  const result: RestaurantResult[] = [];
  for (const store of stores) {
    if (filters.openOnly && !store.isOpen) continue;
    const distanceKm = distances[store.id] ?? null;
    if (filters.radiusKm !== null && (distanceKm === null || distanceKm > filters.radiusKm)) continue;
    const storeMatches = `${store.name} ${store.address}`.toLocaleLowerCase('id-ID').includes(query);
    const menu = products.filter(product => product.storeId === store.id && product.isAvailable
      && (filters.category === 'Semua' || product.category === filters.category)
      && (filters.maxPrice === null || product.price <= filters.maxPrice)
      && (!query || storeMatches || `${product.name} ${product.category}`.toLocaleLowerCase('id-ID').includes(query)));
    if (!menu.length) continue;
    result.push({ store, products: menu, minPrice: Math.min(...menu.map(product => product.price)), distanceKm });
  }
  return result.sort((a, b) => {
    if (sort === 'budget') return a.minPrice - b.minPrice || a.store.name.localeCompare(b.store.name);
    if (sort === 'nearby') return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.store.name.localeCompare(b.store.name);
    return Number(b.store.isOpen) - Number(a.store.isOpen) || b.products.length - a.products.length || a.store.name.localeCompare(b.store.name);
  });
}

export function filterCount(filters: DiscoveryFilters): number {
  return Number(filters.category !== 'Semua') + Number(filters.maxPrice !== null) + Number(filters.openOnly) + Number(filters.radiusKm !== null);
}

export function mergeRecentProduct(ids: unknown, productId: string): string[] {
  const valid = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  return [productId, ...valid.filter(id => id !== productId)].slice(0, 12);
}
