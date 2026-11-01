const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildRestaurantResults, DEFAULT_FILTERS, mergeRecentProduct } = require('../src/lib/discovery.ts');

const stores = [
  { id: 'a', name: 'Dapur Kenanga', address: 'Palembang', isOpen: true },
  { id: 'b', name: 'Kopi Taman', address: 'Ilir', isOpen: false },
  { id: 'c', name: 'Warung Tanpa Titik', address: '', isOpen: true },
];
const products = [
  { id: '1', storeId: 'a', name: 'Nasi ayam', category: 'Makanan', price: 22000, isAvailable: true },
  { id: '2', storeId: 'a', name: 'Es teh', category: 'Minuman', price: 6000, isAvailable: true },
  { id: '3', storeId: 'b', name: 'Kopi susu', category: 'Minuman', price: 12000, isAvailable: true },
  { id: '4', storeId: 'c', name: 'Paket keluarga', category: 'Makanan', price: 60000, isAvailable: true },
  { id: '5', storeId: 'c', name: 'Menu habis', category: 'Makanan', price: 1000, isAvailable: false },
];
const query = (filters = {}, search = '', sort = 'recommended') => buildRestaurantResults(stores, products, { ...DEFAULT_FILTERS, ...filters }, search, sort, { a: 0, b: 2, c: null });

test('search finds a restaurant by its menu, including mixed case and surrounding spaces', () => {
  const matches = query({}, ' NASI ');
  assert.deepEqual(matches.map(row => row.store.id), ['a']);
  assert.deepEqual(matches[0].products.map(product => product.id), ['1']);
  assert.equal(query({}, 'kenanga')[0].products.length, 2);
});
test('combined price/category/open filters apply to the same menu, not different products in a store', () => {
  assert.equal(query({ category: 'Makanan', maxPrice: 15000 }).length, 0);
  assert.deepEqual(query({ category: 'Minuman', maxPrice: 15000, openOnly: true }).map(row => row.store.id), ['a']);
});
test('distance filter excludes unknown coordinates and preserves a zero-distance store', () => {
  assert.deepEqual(query({ radiusKm: 1 }).map(row => row.store.id), ['a']);
  assert.deepEqual(query({}, '', 'nearby').map(row => row.store.id), ['a', 'b', 'c']);
});
test('budget ordering uses available menu prices and never mutates catalog arrays', () => {
  assert.deepEqual(query({}, '', 'budget').map(row => row.minPrice), [6000, 12000, 60000]);
  assert.deepEqual(stores.map(row => row.id), ['a', 'b', 'c']);
  assert.equal(products.length, 5);
});
test('view history deduplicates, tolerates corrupted storage and caps retained public IDs', () => {
  assert.deepEqual(mergeRecentProduct(['a', 1, 'b', 'a'], 'a'), ['a', 'b']);
  assert.deepEqual(mergeRecentProduct(null, 'a'), ['a']);
  assert.equal(mergeRecentProduct(Array.from({ length: 20 }, (_, index) => String(index)), 'new').length, 12);
});
