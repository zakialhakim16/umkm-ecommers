import { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { MotionPressable } from '@/components/Motion';
import { COLORS } from '@/constants/theme';
import { rupiah } from '@/constants/data';
import type { CatalogProduct } from '@/lib/catalogStorage';
import type { RestaurantResult } from '@/lib/discovery';

export function FoodPhoto({ uri, style, icon = 'restaurant' }: { uri: string | null; style: StyleProp<ViewStyle>; icon?: string }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return <View style={[styles.photo, style]}>{uri && failedUri !== uri
    ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailedUri(uri)} />
    : <View style={styles.placeholder}><AppIcon name={icon} size={32} color={COLORS.primary} /></View>}
  </View>;
}

export function FoodMenuCard({ product, compact = false }: { product: CatalogProduct; compact?: boolean }) {
  const router = useRouter();
  return <MotionPressable style={[styles.menu, compact && styles.compactMenu]} accessibilityRole="button" accessibilityLabel={`Lihat ${product.name}, ${rupiah(product.price)}`} onPress={() => router.push({ pathname: '/product', params: { id: product.id } })}>
    <FoodPhoto uri={product.image} style={styles.menuPhoto} />
    <View style={styles.menuBody}>
      <Text style={styles.muted} numberOfLines={1}>{product.storeName}</Text>
      <Text style={styles.menuName} numberOfLines={2}>{product.name}</Text>
      <View style={styles.priceRow}><Text style={styles.price}>{rupiah(product.price)}</Text><View style={styles.plus}><AppIcon name="add" size={17} color="#fff" /></View></View>
    </View>
  </MotionPressable>;
}

export function RestaurantCard({ result }: { result: RestaurantResult }) {
  const router = useRouter();
  const { store, products, distanceKm, minPrice } = result;
  return <MotionPressable style={styles.restaurant} accessibilityRole="button" accessibilityLabel={`Lihat menu ${store.name}`} onPress={() => router.push({ pathname: '/store', params: { id: store.id } })}>
    <FoodPhoto uri={store.imageUrl ?? products[0]?.image ?? null} style={styles.restaurantPhoto} icon="storefront" />
    <View style={styles.restaurantBody}>
      <View style={styles.nameRow}><Text style={styles.restaurantName} numberOfLines={2}>{store.name}</Text><AppIcon name="chevron-forward" size={16} color={COLORS.muted} /></View>
      <Text style={styles.muted} numberOfLines={1}>{[...new Set(products.map(product => product.category))].join(' · ')}</Text>
      <View style={styles.meta}><Text style={[styles.open, !store.isOpen && styles.closed]}>{store.isOpen ? '● Buka' : '● Tutup'}</Text><Text style={styles.muted}>{distanceKm !== null ? `${distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} · garis lurus` : `${products.length} menu`}</Text></View>
      <Text style={styles.from}>Mulai {rupiah(minPrice)}</Text>
      <Text style={styles.address} numberOfLines={1}>{store.address || 'Alamat belum tersedia'}</Text>
    </View>
  </MotionPressable>;
}

const styles = StyleSheet.create({
  photo: { overflow: 'hidden', backgroundColor: '#F7E6D7' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  menu: { width: 164, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border }, compactMenu: { width: 152 },
  menuPhoto: { width: '100%', height: 124 }, menuBody: { padding: 11 }, muted: { fontSize: 11, color: COLORS.secondaryText, lineHeight: 17 },
  menuName: { fontSize: 13, fontWeight: '800', color: COLORS.text, lineHeight: 18, minHeight: 36, marginTop: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }, price: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark },
  plus: { width: 27, height: 27, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  restaurant: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  restaurantPhoto: { width: 100, height: 122, borderRadius: 14 }, restaurantBody: { flex: 1, justifyContent: 'center', minWidth: 0 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restaurantName: { fontSize: 15, fontWeight: '800', lineHeight: 20, color: COLORS.text, flex: 1 }, meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  open: { fontSize: 11, fontWeight: '700', color: COLORS.success }, closed: { color: COLORS.secondaryText }, from: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: COLORS.primaryDark, backgroundColor: COLORS.orange50, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, marginTop: 7 },
  address: { fontSize: 10, color: COLORS.secondaryText, marginTop: 6 },
});
