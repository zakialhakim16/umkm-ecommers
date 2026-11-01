import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { MotionPressable, Reveal } from '@/components/Motion';
import { FoodMenuCard, FoodPhoto, RestaurantCard } from '@/components/FoodCards';
import { FoodFilterSheet } from '@/components/FoodFilterSheet';
import { COLORS } from '@/constants/theme';
import { rupiah } from '@/constants/data';
import { useFoodDiscovery } from '@/hooks/useFoodDiscovery';
import { buildRestaurantResults, DEFAULT_FILTERS, filterCount, type DiscoveryFilters, type DiscoverySort } from '@/lib/discovery';
import { deliveryCoordinate, distanceMeters } from '@/lib/deliveryTracking';
import { clearRecentProducts } from '@/lib/recentProducts';

const SHORTCUTS = [
  { label: 'Makan kenyang', icon: 'restaurant', color: '#E66A32', bg: '#FFF0E4', category: 'Makanan' },
  { label: 'Ngopi dulu', icon: 'cafe', color: '#9B6745', bg: '#F5EDE5', category: 'Minuman' },
  { label: 'Teman ngemil', icon: 'fast-food', color: '#CF7B18', bg: '#FFF5DC', category: 'Camilan' },
  { label: 'Oleh-oleh', icon: 'gift', color: '#B75D7B', bg: '#FCEAF0', category: 'Oleh-oleh' },
  { label: 'Di bawah 25rb', icon: 'wallet-outline', color: '#238A69', bg: '#E5F5EC', action: 'budget' },
  { label: 'Lagi buka', icon: 'storefront', color: '#3F7EA9', bg: '#E9F2FC', action: 'open' },
  { label: 'Favoritku', icon: 'heart', color: '#DC6260', bg: '#FEEDE8', action: 'favorites' },
  { label: 'Pesanan', icon: 'receipt', color: '#8370B3', bg: '#F1EBFA', action: 'orders' },
] as const;

export function FoodDiscoveryScreen({ browse = false }: { browse?: boolean }) {
  const router = useRouter();
  const data = useFoodDiscovery();
  const scroll = useRef<ScrollView>(null);
  const resultsY = useRef(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DiscoveryFilters>({ ...DEFAULT_FILTERS });
  const [sort, setSort] = useState<DiscoverySort>('recommended');
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const address = data.account.address;
  const coordinate = deliveryCoordinate(address?.latitude, address?.longitude);
  const distances = useMemo(() => {
    const from = deliveryCoordinate(address?.latitude, address?.longitude);
    return Object.fromEntries(data.stores.map(store => {
      const to = deliveryCoordinate(store.latitude, store.longitude);
      return [store.id, from && to ? distanceMeters(from, to) / 1000 : null];
    }));
  }, [address?.latitude, address?.longitude, data.stores]);
  const results = useMemo(() => buildRestaurantResults(data.stores, data.products, filters, search, sort, distances), [data.stores, data.products, filters, search, sort, distances]);
  const openStores = new Set(data.stores.filter(store => store.isOpen).map(store => store.id));
  const budgetMenu = data.products.filter(product => product.price <= 25000 && openStores.has(product.storeId)).sort((a, b) => a.price - b.price).slice(0, 10);
  const recent = data.recentIds.flatMap(id => { const product = data.products.find(item => item.id === id); return product ? [product] : []; });
  const featured = data.products.find(product => product.image && openStores.has(product.storeId));
  const cartCount = data.cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeFilters = filterCount(filters);
  const searching = search.trim().length > 0;
  const jumpToResults = () => scroll.current?.scrollTo({ y: resultsY.current, animated: true });
  const applyFilters = (next: DiscoveryFilters) => { setFilters(next); setVisibleCount(12); setFilterOpen(false); jumpToResults(); };
  const reset = () => { setSearch(''); setFilters({ ...DEFAULT_FILTERS }); setSort('recommended'); setVisibleCount(12); };
  const shortcut = (item: typeof SHORTCUTS[number]) => {
    if ('category' in item) applyFilters({ ...DEFAULT_FILTERS, category: item.category });
    else if (item.action === 'budget') { setSort('budget'); applyFilters({ ...DEFAULT_FILTERS, maxPrice: 25000 }); }
    else if (item.action === 'open') applyFilters({ ...DEFAULT_FILTERS, openOnly: true });
    else if (item.action === 'favorites') router.push('/account-details?section=favorites');
    else router.push('/(tabs)/orders');
  };

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={data.loading} onRefresh={() => void data.refresh()} tintColor={COLORS.primary} />}>
      <View style={styles.masthead}>
        <View style={styles.mastheadOrb} />
        <View style={styles.topRow}>
          <MotionPressable style={styles.location} accessibilityRole="button" accessibilityLabel="Ubah alamat pengiriman" onPress={() => router.push('/location')}>
            <View style={styles.locationMark}><AppIcon name="location" color={COLORS.primaryDark} size={20} /></View>
            <View style={styles.locationCopy}><Text style={styles.eyebrow}>ANTAR KE</Text><Text style={styles.locationText} numberOfLines={1}>{address?.details || 'Pilih alamat pengiriman'}</Text></View>
            <AppIcon name="chevron-down" size={16} color={COLORS.text} />
          </MotionPressable>
          <MotionPressable style={styles.cart} onPress={() => router.push('/(tabs)/cart')} accessibilityRole="button" accessibilityLabel={`Keranjang, ${cartCount} item`}><AppIcon name="cart" size={23} color={COLORS.text} />{cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text></View>}</MotionPressable>
        </View>
        <View style={styles.brandRow}><Text style={styles.brand}>Rasa<Text style={styles.brandAccent}>Lokal</Text><Text style={styles.brandDot}> / </Text><Text style={styles.brandSmall}>KULINER</Text></Text><Pressable onPress={() => router.push('/notifications')} accessibilityRole="button" accessibilityLabel="Buka notifikasi" style={styles.bell}><AppIcon name="notifications-outline" size={20} color={COLORS.text} /></Pressable></View>
        <Text style={styles.headline}>{browse ? 'Ketemu rasa favoritmu.' : 'Lagi pengin makan apa?'}</Text>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={21} color={COLORS.primary} />
          <TextInput accessibilityLabel="Cari menu atau resto" value={search} onChangeText={value => { setSearch(value); setVisibleCount(12); }} onSubmitEditing={jumpToResults} placeholder="Cari nasi, kopi, atau resto favorit…" placeholderTextColor="#958880" returnKeyType="search" style={styles.searchInput} />
          {search ? <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Hapus pencarian" style={styles.clear}><AppIcon name="close" size={18} color={COLORS.secondaryText} /></Pressable> : <View style={styles.searchHint}><Text style={styles.searchHintText}>LOKAL</Text></View>}
        </View>
      </View>

      {data.error ? <View style={styles.errorBox}><Text style={styles.errorText} accessibilityRole="alert">{data.error}</Text><Pressable onPress={() => void data.refresh()} style={styles.retry}><Text style={styles.link}>Coba lagi</Text></Pressable></View> : null}
      {!browse && !searching && <>
        <Reveal style={styles.shortcutCard}>
          {SHORTCUTS.map(item => <MotionPressable key={item.label} style={styles.shortcut} onPress={() => shortcut(item)} accessibilityRole="button"><View style={[styles.shortcutIcon, { backgroundColor: item.bg }]}><AppIcon name={item.icon} color={item.color} size={25} /></View><Text style={styles.shortcutText}>{item.label}</Text></MotionPressable>)}
        </Reveal>

        <Reveal delay={70} style={styles.section}>
          <MotionPressable style={styles.campaign} onPress={() => { setSort('budget'); applyFilters({ ...DEFAULT_FILTERS, maxPrice: 25000 }); }} accessibilityRole="button" accessibilityLabel="Jelajahi menu maksimal 25 ribu">
            <View style={styles.campaignCircle} /><View style={styles.campaignCopy}><Text style={styles.campaignEyebrow}>ENAKNYA JAJAN LOKAL</Text><Text style={styles.campaignTitle}>Rasa juara.{ '\n' }Kantong aman.</Text><Text style={styles.campaignSubtitle}>Cari menu sampai 25 ribu</Text><View style={styles.campaignCta}><Text style={styles.campaignCtaText}>Cari yang pas</Text><AppIcon name="arrow-forward" color="#fff" size={15} /></View></View>
            <View style={styles.campaignVisual}>{featured ? <FoodPhoto uri={featured.image} style={styles.campaignPhoto} /> : <View style={[styles.campaignPhoto, styles.campaignPlaceholder]}><AppIcon name="restaurant" size={58} color="#DCE9CF" /></View>}<View style={styles.localStamp}><Text style={styles.stampTop}>100%</Text><Text style={styles.stampBottom}>LOKAL</Text></View></View>
          </MotionPressable>
        </Reveal>

        <View style={[styles.section, styles.budgetSection]}>
          <SectionHeading title="Enak & terjangkau" subtitle="Menu hingga 25 ribu dari resto yang buka" action="Jelajahi" onPress={() => { setSort('budget'); applyFilters({ ...DEFAULT_FILTERS, maxPrice: 25000, openOnly: true }); }} icon="wallet-outline" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {budgetMenu.map(product => <FoodMenuCard key={product.id} product={product} compact />)}
            {!budgetMenu.length && <InlineEmpty loading={data.loading} text="Belum ada menu di rentang harga ini. Jelajahi pilihan resto di bawah." />}
          </ScrollView>
          <Text style={styles.priceNote}>Harga menu belum termasuk ongkir dan biaya layanan.</Text>
        </View>

        <View style={styles.localBanner}><View style={styles.localIcon}><AppIcon name="storefront" size={26} color="#28654A" /></View><View style={styles.flex}><Text style={styles.localTitle}>Dekat di hati, dekat di kotamu.</Text><Text style={styles.localText}>Setiap pesanan ikut menghidupkan dapur UMKM.</Text></View><AppIcon name="heart" size={19} color="#28654A" /></View>

        {recent.length > 0 && <View style={styles.section}><SectionHeading title="Tadi sempat dilirik" subtitle="Menu yang terakhir kamu buka di perangkat ini" action="Hapus" onPress={() => { void clearRecentProducts().then(() => data.setRecentIds([])).catch(() => Alert.alert('Belum dapat menghapus', 'Coba lagi sebentar.')); }} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>{recent.map(product => <FoodMenuCard key={product.id} product={product} compact />)}</ScrollView></View>}
      </>}

      <View style={styles.results} onLayout={event => { resultsY.current = event.nativeEvent.layout.y; }}>
        <SectionHeading title={searching ? `Hasil untuk “${search.trim()}”` : browse ? 'Jelajah resto lokal' : 'Resto untuk seleramu'} subtitle={data.loading ? 'Menyiapkan pilihan…' : `${results.length} resto cocok dengan pilihanmu`} />
        <View style={styles.sortRow}>{([{ id: 'recommended', title: 'Pilihan lokal' }, { id: 'budget', title: 'Harga ramah' }, { id: 'nearby', title: 'Terdekat' }] as const).map(tab => <Pressable key={tab.id} onPress={() => { if (tab.id === 'nearby' && !coordinate) { router.push('/location'); return; } setSort(tab.id); setVisibleCount(12); }} accessibilityRole="tab" accessibilityState={{ selected: sort === tab.id }} style={[styles.sortTab, sort === tab.id && styles.sortTabActive]}><Text style={[styles.sortText, sort === tab.id && styles.sortTextActive]}>{tab.title}</Text></Pressable>)}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pressable style={[styles.filterChip, styles.filterPrimary]} onPress={() => setFilterOpen(true)} accessibilityRole="button" accessibilityLabel="Filter resto"><AppIcon name="options" size={16} color={COLORS.primaryDark} /><Text style={styles.filterPrimaryText}>Filter{activeFilters ? ` · ${activeFilters}` : ''}</Text></Pressable>
          <Pressable style={[styles.filterChip, filters.openOnly && styles.chipSelected]} onPress={() => applyFilters({ ...filters, openOnly: !filters.openOnly })}><Text style={styles.filterText}>Buka sekarang</Text></Pressable>
          <Pressable style={[styles.filterChip, filters.maxPrice !== null && styles.chipSelected]} onPress={() => setFilterOpen(true)}><Text style={styles.filterText}>{filters.maxPrice ? `≤ ${rupiah(filters.maxPrice)}` : 'Harga menu'}</Text><AppIcon name="chevron-down" size={14} color={COLORS.secondaryText} /></Pressable>
          <Pressable style={[styles.filterChip, filters.category !== 'Semua' && styles.chipSelected]} onPress={() => setFilterOpen(true)}><Text style={styles.filterText}>{filters.category === 'Semua' ? 'Kategori' : filters.category}</Text><AppIcon name="chevron-down" size={14} color={COLORS.secondaryText} /></Pressable>
          {activeFilters > 0 && <Pressable onPress={reset} style={styles.filterChip}><Text style={styles.link}>Reset</Text></Pressable>}
        </ScrollView>
        {data.loading && !data.stores.length ? <View style={styles.skeletons}>{[0, 1, 2].map(index => <View key={index} style={styles.skeleton}><View style={styles.skeletonPhoto} /><View style={styles.flex}><View style={styles.skeletonLine} /><View style={[styles.skeletonLine, { width: '65%' }]} /><View style={[styles.skeletonLine, { width: '40%' }]} /></View></View>)}<ActivityIndicator color={COLORS.primary} /></View> : results.slice(0, visibleCount).map(result => <RestaurantCard key={result.store.id} result={result} />)}
        {!data.loading && !data.error && !results.length && <View style={styles.empty}><View style={styles.emptyIcon}><AppIcon name="search" size={30} color={COLORS.primary} /></View><Text style={styles.emptyTitle}>Belum ketemu yang pas</Text><Text style={styles.emptyText}>{data.stores.length ? 'Coba nama menu lain atau longgarkan filter pencarianmu.' : 'Menu dari mitra akan tampil di sini setelah tersedia.'}</Text>{(activeFilters > 0 || searching) && <Pressable style={styles.emptyButton} onPress={reset}><Text style={styles.link}>Lihat semua pilihan</Text></Pressable>}</View>}
        {results.length > visibleCount && <Pressable style={styles.loadMore} onPress={() => setVisibleCount(count => count + 12)}><Text style={styles.link}>Lihat resto lainnya ({results.length - visibleCount})</Text><AppIcon name="chevron-down" size={16} color={COLORS.primary} /></Pressable>}
        <View style={styles.endNote}><AppIcon name="restaurant" size={19} color="#B9AAA0" /><Text style={styles.endTitle}>Rasa lokal, cerita yang dekat.</Text><Text style={styles.endText}>Temukan favorit baru dari dapur di sekitarmu.</Text></View>
      </View>
    </ScrollView>
    {filterOpen && <FoodFilterSheet value={filters} hasLocation={Boolean(coordinate)} onClose={() => setFilterOpen(false)} onApply={applyFilters} />}
  </SafeAreaView>;
}

function SectionHeading({ title, subtitle, action, onPress, icon }: { title: string; subtitle: string; action?: string; onPress?: () => void; icon?: string }) {
  return <View style={styles.sectionHeading}><View style={styles.flex}><View style={styles.sectionTitleRow}>{icon && <AppIcon name={icon} size={19} color={COLORS.primaryDark} />}<Text style={styles.sectionTitle}>{title}</Text></View><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>{action && <Pressable onPress={onPress} style={styles.sectionAction} accessibilityRole="button" accessibilityLabel={`${action} ${title}`}><Text style={styles.link}>{action}</Text><AppIcon name="chevron-forward" size={14} color={COLORS.primaryDark} /></Pressable>}</View>;
}
function InlineEmpty({ loading, text }: { loading: boolean; text: string }) { return <View style={styles.inlineEmpty}>{loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.emptyText}>{text}</Text>}</View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF0E4' }, scroll: { flex: 1, backgroundColor: '#F7F5F1' }, content: { paddingBottom: 110, width: '100%', maxWidth: 840, alignSelf: 'center' }, flex: { flex: 1, minWidth: 0 },
  masthead: { padding: 18, paddingBottom: 26, backgroundColor: '#FFF0E4', overflow: 'hidden' }, mastheadOrb: { position: 'absolute', height: 250, width: 250, borderRadius: 125, backgroundColor: '#FFE5D1', right: -100, top: -100 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 15 }, location: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, locationMark: { width: 35, height: 35, backgroundColor: '#FFFFFFA0', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, locationCopy: { flex: 1 }, eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#9D664A' }, locationText: { fontSize: 12, fontWeight: '800', color: COLORS.text, marginTop: 3 }, cart: { height: 44, width: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, cartBadge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, cartBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 17 }, brand: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5, color: COLORS.text }, brandAccent: { color: COLORS.primary }, brandDot: { color: '#D0B19B', fontWeight: '400' }, brandSmall: { fontSize: 9, letterSpacing: 2, color: '#9C765E' }, bell: { padding: 10 }, headline: { fontSize: 25, fontWeight: '900', letterSpacing: -0.8, color: '#402E22', marginTop: 1, marginBottom: 15 },
  searchBox: { backgroundColor: '#fff', borderRadius: 16, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: '#F3DDCC' }, searchInput: { flex: 1, minWidth: 0, fontSize: 13, color: COLORS.text, paddingVertical: 12 }, searchHint: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, backgroundColor: '#F8F2EC' }, searchHintText: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: '#B79F8E' }, clear: { padding: 7 },
  shortcutCard: { marginHorizontal: 16, marginTop: -10, backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 22, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#F0E6DD' }, shortcut: { width: '25%', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 3, gap: 7 }, shortcutIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, shortcutText: { fontSize: 10, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 18 }, campaign: { minHeight: 192, backgroundColor: '#264D3C', borderRadius: 23, overflow: 'hidden', padding: 20, flexDirection: 'row', alignItems: 'center' }, campaignCircle: { width: 240, height: 240, borderRadius: 120, backgroundColor: '#365C44', position: 'absolute', right: -65, top: -25 }, campaignCopy: { flex: 1, zIndex: 1 }, campaignEyebrow: { fontSize: 8, color: '#CEE2BD', fontWeight: '800', letterSpacing: 1.6 }, campaignTitle: { fontSize: 26, lineHeight: 29, letterSpacing: -0.9, fontWeight: '900', color: '#FFF4D2', marginTop: 10 }, campaignSubtitle: { fontSize: 11, color: '#DAE8D3', marginTop: 8 }, campaignCta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 }, campaignCtaText: { fontSize: 11, fontWeight: '800', color: '#fff' }, campaignVisual: { width: '35%', alignItems: 'center' }, campaignPhoto: { width: 128, height: 128, borderRadius: 64, borderWidth: 5, borderColor: '#FFFFFF35', transform: [{ rotate: '12deg' }] }, campaignPlaceholder: { backgroundColor: '#365C44', alignItems: 'center', justifyContent: 'center' }, localStamp: { backgroundColor: '#EDD392', padding: 9, borderRadius: 13, transform: [{ rotate: '-10deg' }], position: 'absolute', bottom: -10, right: 0 }, stampTop: { fontSize: 18, fontWeight: '900', color: '#35543C', textAlign: 'center' }, stampBottom: { fontSize: 8, fontWeight: '900', letterSpacing: 2, color: '#35543C' },
  budgetSection: { backgroundColor: '#FFF1E5', borderWidth: 1, borderColor: '#F7E3D3', borderRadius: 22, paddingTop: 15, paddingHorizontal: 12, paddingBottom: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 13 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, sectionTitle: { flexShrink: 1, fontSize: 18, fontWeight: '900', letterSpacing: -0.5, color: COLORS.text }, sectionSubtitle: { fontSize: 11, lineHeight: 16, color: COLORS.secondaryText, marginTop: 4 }, sectionAction: { flexDirection: 'row', alignItems: 'center', minHeight: 44 }, link: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark }, rail: { gap: 10, paddingBottom: 3 }, priceNote: { fontSize: 9, lineHeight: 14, color: '#9A7964', marginTop: 8 },
  localBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 18, backgroundColor: '#E8EFE4', borderRadius: 17, padding: 14 }, localIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#FFFFFF85', alignItems: 'center', justifyContent: 'center' }, localTitle: { fontSize: 12, fontWeight: '800', color: '#35523D' }, localText: { fontSize: 10, lineHeight: 15, color: '#69816B', marginTop: 4 },
  results: { marginHorizontal: 16, paddingTop: 24 }, sortRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E4DDD5', marginBottom: 13 }, sortTab: { flex: 1, minHeight: 45, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' }, sortTabActive: { borderBottomColor: COLORS.primary }, sortText: { fontSize: 12, fontWeight: '700', color: COLORS.secondaryText }, sortTextActive: { color: COLORS.primaryDark, fontWeight: '900' }, filters: { gap: 7, paddingBottom: 15 }, filterChip: { minHeight: 38, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E0D8', flexDirection: 'row', alignItems: 'center', gap: 6 }, filterPrimary: { backgroundColor: '#FFEADC', borderColor: '#F2C7A9' }, filterPrimaryText: { fontSize: 11, fontWeight: '800', color: COLORS.primaryDark }, filterText: { fontSize: 11, color: COLORS.secondaryText, fontWeight: '700' }, chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.orange50 },
  empty: { padding: 25, backgroundColor: '#fff', alignItems: 'center', borderRadius: 20, gap: 10 }, emptyIcon: { backgroundColor: COLORS.orange50, width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text }, emptyText: { fontSize: 12, lineHeight: 18, color: COLORS.secondaryText, textAlign: 'center' }, emptyButton: { padding: 14 }, inlineEmpty: { padding: 18, width: 270, minHeight: 100, justifyContent: 'center' }, loadMore: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14 },
  skeletons: { gap: 10 }, skeleton: { padding: 14, backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }, skeletonPhoto: { width: 94, height: 110, borderRadius: 14, backgroundColor: '#F1EBE3' }, skeletonLine: { height: 14, width: '90%', backgroundColor: '#F1EBE3', marginBottom: 14, borderRadius: 5 },
  endNote: { paddingTop: 30, paddingBottom: 8, alignItems: 'center', gap: 6 }, endTitle: { fontSize: 16, fontWeight: '900', color: '#B3A399', letterSpacing: -0.5 }, endText: { fontSize: 10, color: '#B3A399' }, errorBox: { padding: 16, backgroundColor: COLORS.dangerSoft, margin: 16, borderRadius: 16 }, errorText: { color: COLORS.danger, fontSize: 12, lineHeight: 18 }, retry: { paddingTop: 12, minHeight: 40 },
});
