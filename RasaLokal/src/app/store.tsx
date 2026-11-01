import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { FoodPhoto } from '@/components/FoodCards';
import { MotionPressable } from '@/components/Motion';
import { useFoodDiscovery } from '@/hooks/useFoodDiscovery';
import { useSafeBack } from '@/hooks/useSafeBack';
import { COLORS } from '@/constants/theme';
import { rupiah } from '@/constants/data';
import { FOOD_CATEGORIES } from '@/lib/discovery';

export default function StoreScreen() {
  const router = useRouter();
  const back = useSafeBack('/(tabs)/umkm');
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const storeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const data = useFoodDiscovery();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const store = data.stores.find(item => item.id === storeId);
  const menu = useMemo(() => data.products.filter(item => item.storeId === storeId), [data.products, storeId]);
  const visible = menu.filter(item => (category === 'Semua' || item.category === category) && item.name.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));
  const cart = data.cart.filter(item => item.storeId === storeId);
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.toolbar}><Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Kembali ke resto" style={styles.iconButton}><AppIcon name="chevron-back" /></Pressable><Text style={styles.toolbarTitle}>Dapur lokal</Text><Pressable onPress={() => router.push('/(tabs)/cart')} accessibilityRole="button" accessibilityLabel="Buka keranjang" style={styles.iconButton}><AppIcon name="cart" /></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={data.loading} onRefresh={() => void data.refresh()} tintColor={COLORS.primary} />}>
      {data.loading && !store && <ActivityIndicator style={styles.loading} color={COLORS.primary} />}
      {!!data.error && <View style={styles.message}><Text style={styles.body}>{data.error}</Text><Pressable onPress={() => void data.refresh()} style={styles.iconButton}><Text style={styles.link}>Coba lagi</Text></Pressable></View>}
      {!data.loading && !store && !data.error && <View style={styles.message}><Text style={styles.title}>Resto belum tersedia</Text><Text style={styles.body}>Kembali ke Jelajah untuk menemukan pilihan lainnya.</Text></View>}
      {store && <>
        <FoodPhoto uri={store.imageUrl ?? menu.find(item => item.image)?.image ?? null} style={styles.hero} icon="storefront" />
        <View style={styles.summary}>
          <View style={styles.kicker}><Text style={styles.kickerText}>MITRA RASALOKAL</Text><Text style={[styles.open, !store.isOpen && { color: COLORS.secondaryText }]}>{store.isOpen ? '● Buka sekarang' : '● Sedang tutup'}</Text></View>
          <Text style={styles.title}>{store.name}</Text><Text style={styles.body}>{store.address || 'Alamat belum tersedia'}</Text>
          <View style={styles.facts}><View style={styles.fact}><AppIcon name="restaurant" size={18} color={COLORS.primary} /><Text style={styles.factText}>{menu.length} menu tersedia</Text></View>{menu.length > 0 && <View style={styles.fact}><AppIcon name="wallet-outline" size={18} color={COLORS.primary} /><Text style={styles.factText}>Mulai {rupiah(Math.min(...menu.map(item => item.price)))}</Text></View>}</View>
          {!store.isOpen && <Text style={styles.closedNotice}>Resto sedang tutup. Kamu masih bisa melihat menunya.</Text>}
        </View>
        <View style={styles.menuArea}><Text style={styles.menuTitle}>Pilih menu favoritmu</Text><Text style={styles.body}>Harga menu belum termasuk ongkir dan biaya layanan.</Text>
          <View style={styles.search}><AppIcon name="search" size={19} color={COLORS.primary} /><TextInput accessibilityLabel="Cari menu di resto ini" value={search} onChangeText={setSearch} placeholder="Cari menu di sini…" placeholderTextColor={COLORS.muted} style={styles.input} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{FOOD_CATEGORIES.filter(item => item === 'Semua' || menu.some(product => product.category === item)).map(item => <Pressable key={item} style={[styles.category, category === item && styles.categoryActive]} accessibilityRole="tab" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)}><Text style={[styles.categoryText, category === item && { color: '#fff' }]}>{item}</Text></Pressable>)}</ScrollView>
          {visible.map(product => <MotionPressable key={product.id} style={styles.menuRow} accessibilityRole="button" accessibilityLabel={`Lihat ${product.name}`} onPress={() => router.push({ pathname: '/product', params: { id: product.id } })}>
            <View style={styles.menuCopy}><Text style={styles.menuName}>{product.name}</Text><Text numberOfLines={2} style={styles.description}>{product.description || product.category}</Text><Text style={styles.price}>{rupiah(product.price)}</Text><Text style={styles.customize}>{product.details.variants.length ? `${product.details.variants.length} pilihan varian` : 'Lihat detail menu'}</Text></View>
            <View><FoodPhoto uri={product.image} style={styles.menuPhoto} /><View style={styles.add}><AppIcon name="add" size={19} color="#fff" /></View></View>
          </MotionPressable>)}
          {!visible.length && <Text style={styles.noMenu}>Belum ada menu yang sesuai. Coba kategori atau kata lain.</Text>}
        </View>
      </>}
    </ScrollView>
    {quantity > 0 && <View style={styles.cartWrap}><MotionPressable style={styles.cartBar} onPress={() => router.push('/(tabs)/cart')} accessibilityRole="button"><View style={styles.cartQuantity}><Text style={styles.cartQuantityText}>{quantity}</Text></View><View style={styles.cartCopy}><Text style={styles.cartTitle}>Lihat keranjang</Text><Text style={styles.cartSubtitle}>Menu dari resto ini</Text></View><Text style={styles.cartTotal}>{rupiah(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</Text><AppIcon name="chevron-forward" size={18} color="#fff" /></MotionPressable></View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 56 }, toolbarTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.text, textAlign: 'center' }, iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, content: { paddingBottom: 25, width: '100%', maxWidth: 840, alignSelf: 'center' }, hero: { height: 220, width: '100%' }, summary: { marginTop: -24, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 }, kicker: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' }, kickerText: { fontSize: 9, letterSpacing: 1.5, fontWeight: '800', color: COLORS.primaryDark }, open: { fontSize: 11, fontWeight: '700', color: COLORS.success }, title: { fontSize: 27, fontWeight: '900', letterSpacing: -0.8, color: COLORS.text, marginTop: 10, marginBottom: 7 }, body: { fontSize: 12, lineHeight: 18, color: COLORS.secondaryText }, facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 }, fact: { flexDirection: 'row', alignItems: 'center', gap: 7 }, factText: { fontSize: 11, fontWeight: '700', color: COLORS.text }, closedNotice: { backgroundColor: COLORS.cream, color: COLORS.secondaryText, padding: 12, borderRadius: 12, marginTop: 16, fontSize: 12 }, menuArea: { borderTopWidth: 7, borderColor: COLORS.background, padding: 18 }, menuTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 5 }, search: { minHeight: 47, borderRadius: 13, backgroundColor: COLORS.background, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 15 }, input: { flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 10 }, categories: { gap: 8, paddingVertical: 16 }, category: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 15, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, categoryActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, categoryText: { fontSize: 12, fontWeight: '700', color: COLORS.secondaryText }, menuRow: { flexDirection: 'row', gap: 15, paddingVertical: 18, borderBottomWidth: 1, borderColor: COLORS.border }, menuCopy: { flex: 1 }, menuName: { fontSize: 16, fontWeight: '800', color: COLORS.text }, description: { fontSize: 12, lineHeight: 18, color: COLORS.secondaryText, marginTop: 5 }, price: { fontSize: 15, fontWeight: '900', color: COLORS.primaryDark, marginTop: 10 }, customize: { fontSize: 10, color: COLORS.secondaryText, marginTop: 5 }, menuPhoto: { width: 105, height: 105, borderRadius: 16 }, add: { position: 'absolute', bottom: -6, right: -4, width: 33, height: 33, borderRadius: 12, borderWidth: 3, borderColor: '#fff', backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, noMenu: { paddingVertical: 28, color: COLORS.secondaryText, fontSize: 13 }, message: { padding: 22 }, link: { color: COLORS.primary, fontWeight: '800' }, loading: { padding: 40 }, cartWrap: { padding: 14, borderTopWidth: 1, borderColor: COLORS.border }, cartBar: { minHeight: 60, borderRadius: 18, paddingHorizontal: 15, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 12 }, cartQuantity: { backgroundColor: '#FFFFFF25', width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, cartQuantityText: { fontSize: 14, fontWeight: '900', color: '#fff' }, cartCopy: { flex: 1 }, cartTitle: { fontSize: 14, fontWeight: '800', color: '#fff' }, cartSubtitle: { fontSize: 10, color: '#FFE7D9', marginTop: 2 }, cartTotal: { fontSize: 14, fontWeight: '900', color: '#fff' },
});
