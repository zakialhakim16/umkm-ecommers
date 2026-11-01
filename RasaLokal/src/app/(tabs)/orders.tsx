import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, RADIUS, SOFT_SHADOW, SPACING, TYPE } from '@/constants/theme';
import { rupiah } from '@/constants/data';
import { observeOrders, ORDER_STATUS_LABELS, type ShopOrder } from '@/lib/orderStorage';
import { MotionPressable, Reveal } from '@/components/Motion';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'history'>('active');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    return observeOrders('buyer', (loadedOrders) => { setOrders(loadedOrders); setLoading(false); }, (error: unknown) => {
      setLoading(false);
      Alert.alert('Pesanan tidak dapat dimuat', error instanceof Error ? error.message : 'Periksa koneksi.');
    });
  }, []));

  const finalStatuses = ['completed', 'delivered', 'cancelled', 'payment_failed', 'rejected'];
  const visibleOrders = orders.filter((order) => filter === 'history' ? finalStatuses.includes(order.status) : !finalStatuses.includes(order.status));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Reveal><Text style={styles.eyebrow}>AKTIVITAS BELANJA</Text><Text style={styles.title}>Pesanan saya</Text><Text style={styles.subtitle}>Pantau proses dari dapur UMKM hingga sampai ke rumah.</Text></Reveal>
        <View style={styles.filters}>
          {(['active', 'history'] as const).map((item) => <Pressable key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'active' ? `Berlangsung (${orders.filter((order) => !finalStatuses.includes(order.status)).length})` : `Riwayat (${orders.filter((order) => finalStatuses.includes(order.status)).length})`}</Text></Pressable>)}
        </View>
        {loading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}
        {!loading && visibleOrders.map((order,index) => (
          <Reveal key={order.id} delay={Math.min(index,6)*55}><MotionPressable style={styles.card} onPress={() => router.push({ pathname: '/tracking', params: { id: order.id } } as any)}>
            <View style={styles.icon}><AppIcon name="bag-check" size={24} color={COLORS.primary} /></View>
            <View style={styles.info}>
              <Text style={styles.orderNo}>Pesanan #{order.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.storeName}>{order.storeName}</Text>
              <Text style={styles.status}>{ORDER_STATUS_LABELS[order.status]}</Text>
              <Text style={styles.detail}>{order.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}</Text>
              <Text style={styles.detail}>{new Date(order.createdAt).toLocaleDateString('id-ID')} · {rupiah(order.total)}</Text>
            </View>
            <AppIcon name="chevron-forward" size={18} color={COLORS.muted}/>
          </MotionPressable></Reveal>
        ))}
        {!loading && visibleOrders.length === 0 && <View style={styles.empty}><AppIcon name="receipt" size={28} color={COLORS.muted} /><Text style={styles.emptyText}>{filter === 'active' ? 'Tidak ada pesanan yang sedang berlangsung' : 'Belum ada riwayat pesanan'}</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 110, gap: 12 },
  eyebrow:{...TYPE.caption,color:COLORS.primary,letterSpacing:1.5,marginTop:8},
  title: { ...TYPE.h1, color: COLORS.text, marginTop:5 },subtitle:{...TYPE.body,color:COLORS.secondaryText,marginTop:5,marginBottom:16,maxWidth:310},
  filters: { flexDirection: 'row', padding: 4, borderRadius: RADIUS.md, backgroundColor: COLORS.cream, marginBottom: 4 },
  filter: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: COLORS.card, ...SOFT_SHADOW },
  filterText: { fontSize: 11, fontWeight: '800', color: COLORS.muted },
  filterTextActive: { color: COLORS.primary },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, backgroundColor:COLORS.card, ...SOFT_SHADOW },
  icon: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.orange50, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12 },
  orderNo: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  storeName: { marginTop: 2, fontSize: 10, fontWeight: '700', color: COLORS.secondaryText },
  status: { marginTop: 3, fontSize: 11, fontWeight: '800', color: COLORS.primary },
  detail: { marginTop: 5, fontSize: 10, color: COLORS.secondaryText },
  loader: { marginTop: 30 },
  empty: { alignItems: 'center', gap: 9, paddingVertical: 45 },
  emptyText: { fontSize: 12, color: COLORS.secondaryText },
});
