import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { EMPTY_ACCOUNT, loadAccountData } from '@/lib/accountStorage';
import { loadCartItems, type CartItem } from '@/lib/cartStorage';
import { loadPublicProducts, loadPublicStores, type CatalogProduct, type Store } from '@/lib/catalogStorage';
import { loadRecentProducts } from '@/lib/recentProducts';

export function useFoodDiscovery() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    const results = await Promise.allSettled([loadPublicProducts(), loadPublicStores(), loadAccountData(), loadCartItems(), loadRecentProducts()] as const);
    if (current !== request.current) return;
    const [menu, restaurants, customer, basket, recent] = results;
    if (menu.status === 'fulfilled') setProducts(menu.value);
    if (restaurants.status === 'fulfilled') setStores(restaurants.value);
    setError(menu.status === 'rejected' || restaurants.status === 'rejected' ? 'Menu belum bisa dimuat. Periksa koneksi lalu coba lagi.' : '');
    setAccount(customer.status === 'fulfilled' ? customer.value : EMPTY_ACCOUNT);
    setCart(basket.status === 'fulfilled' ? basket.value : []);
    setRecentIds(recent.status === 'fulfilled' ? recent.value : []);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; };
  }, [refresh]));
  return { products, stores, account, cart, recentIds, setRecentIds, loading, error, refresh };
}
