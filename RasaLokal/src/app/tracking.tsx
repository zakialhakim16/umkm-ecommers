import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { COLORS, SHADOW } from '@/constants/theme';
import { rupiah } from '@/constants/data';
import { TopHeader } from '@/components/TopHeader';
import { cancelBuyerOrder, observeOrders, ORDER_STATUS_LABELS, reorderBuyerOrder, submitOrderReview, type ShopOrder } from '@/lib/orderStorage';
import { distanceMeters, getTrackingStage, isFreshDriverLocation, TRACKING_STEPS } from '@/lib/deliveryTracking';
import DriverLocationMap from '@/components/DriverLocationMap';

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foodRating, setFoodRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const initializedReviewOrder = useRef<string | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    return observeOrders('buyer', (loadedOrders) => {
      setOrders(loadedOrders);
      const loadedOrder = orderId ? loadedOrders.find((item) => item.id === orderId) : loadedOrders[0];
      if (loadedOrder?.review && initializedReviewOrder.current !== loadedOrder.id) {
        initializedReviewOrder.current = loadedOrder.id;
        setFoodRating(loadedOrder.review.foodRating);
        setDeliveryRating(loadedOrder.review.deliveryRating ?? 5);
        setReviewComment(loadedOrder.review.comment);
        setReviewTags(loadedOrder.review.tags);
      }
      setLoading(false);
      setError('');
    }, () => { setLoading(false); setError('Pembaruan pesanan belum dapat dimuat. Mencoba menghubungkan kembali.'); }, orderId);
  }, [orderId]));

  const order = orderId ? orders.find((item) => item.id === orderId) : orders[0];
  const currentStage = order ? getTrackingStage(order.status) : null;
  const driver = order?.driver;
  const freshLocation = driver && isFreshDriverLocation(driver.recordedAt);
  const destinationDistance = driver?.coordinate && driver.destination ? distanceMeters(driver.coordinate, driver.destination) : null;

  const cancelOrder = (selectedOrder: ShopOrder) => {
    const reasons = ['Berubah pikiran', 'Alamat pengiriman salah', 'Pesanan dibuat tidak sengaja'];
    Alert.alert('Batalkan pesanan?', 'Pembatalan hanya tersedia sebelum merchant mulai memproses pesanan.', [
      { text: 'Kembali', style: 'cancel' },
      ...reasons.map((reason) => ({
        text: reason,
        onPress: async () => {
          setActionLoading(true);
          try { await cancelBuyerOrder(selectedOrder.id, reason); }
          catch (actionError) { Alert.alert('Tidak dapat membatalkan', actionError instanceof Error ? actionError.message : 'Silakan coba lagi.'); }
          finally { setActionLoading(false); }
        },
      })),
    ]);
  };

  const reorder = async (selectedOrder: ShopOrder) => {
    setActionLoading(true);
    try {
      const count = await reorderBuyerOrder(selectedOrder.id);
      Alert.alert('Ditambahkan ke keranjang', `${count} menu yang masih tersedia telah ditambahkan.`);
      router.push('/(tabs)/cart');
    } catch (actionError) {
      Alert.alert('Tidak dapat memesan lagi', actionError instanceof Error ? actionError.message : 'Menu sedang tidak tersedia.');
    } finally { setActionLoading(false); }
  };

  const saveReview = async (selectedOrder: ShopOrder) => {
    setActionLoading(true);
    try {
      await submitOrderReview({ orderId: selectedOrder.id, foodRating, deliveryRating: selectedOrder.driver ? deliveryRating : null, comment: reviewComment, tags: reviewTags });
      Alert.alert('Terima kasih', 'Ulasanmu telah tersimpan dan membantu UMKM berkembang.');
    } catch (actionError) {
      Alert.alert('Ulasan belum tersimpan', actionError instanceof Error ? actionError.message : 'Silakan coba lagi.');
    } finally { setActionLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TopHeader title="Detail Pesanan" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />}
        {error !== '' && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {!loading && order && <>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}><AppIcon name={order.status === 'cancelled' || order.status === 'payment_failed' ? 'information-circle-outline' : 'checkmark-circle-outline'} size={28} color={order.status === 'cancelled' || order.status === 'payment_failed' ? COLORS.danger : COLORS.success} /></View>
            <View style={styles.statusCopy}><Text style={styles.statusTitle}>{ORDER_STATUS_LABELS[order.status]}</Text><Text style={styles.statusText}>Pesanan #{order.id.slice(0, 8).toUpperCase()}</Text></View>
          </View>
          {order.paymentMethod !== 'cod' && order.paymentStatus !== 'success'
            && !['cancelled', 'payment_failed', 'rejected', 'completed', 'delivered'].includes(order.status) && (
              <Pressable
                style={styles.payButton}
                onPress={() => router.push({ pathname: '/payment', params: { orderIds: JSON.stringify([order.id]) } } as any)}
                accessibilityRole="button"
              >
                <Text style={styles.payButtonText}>Lanjutkan pembayaran</Text>
                <AppIcon name="arrow-forward" size={17} color="#fff" />
              </Pressable>
            )}
          {currentStage !== null && (
            <View style={styles.stepsCard}>
              <View style={styles.stepsRow}>
                {TRACKING_STEPS.map((step, index) => {
                  const active = index <= currentStage;
                  return <View key={step.label} style={styles.stepWrap} accessible accessibilityLabel={`${step.label}, ${index === currentStage ? 'tahap saat ini' : index < currentStage ? 'sudah dilalui' : 'belum dimulai'}`} accessibilityState={{ selected: index === currentStage }}>
                    <Text style={[styles.stepLabel, active && styles.stepActiveText]}>{step.label}</Text>
                    <View style={[styles.stepDot, active && styles.stepDotActive]} />
                    {index < TRACKING_STEPS.length - 1 ? <View style={[styles.stepLine, index < currentStage && styles.stepLineActive]} /> : null}
                  </View>;
                })}
              </View>
            </View>
          )}
          <View style={styles.driverCard}>
            <Text style={styles.orderTitle}>Pelacakan driver</Text>
            <Text style={styles.driverDescription}>{order.status === 'completed' ? 'Pengiriman selesai.' : order.status === 'cancelled' || order.status === 'payment_failed' ? 'Pengiriman tidak dilanjutkan.' : 'Status perjalanan diperbarui otomatis dari lokasi dan aktivitas driver.'}</Text>
            {driver ? <>
              <Text style={styles.driverName}>{driver.name}{driver.vehicle ? ` · ${driver.vehicle}` : ''}</Text>
              {driver.phone !== '' && <Text style={styles.statusText}>{driver.phone}</Text>}
              {driver.coordinate ? <>
                <Text style={[styles.locationState, !freshLocation && styles.locationStale]}>{freshLocation ? 'Lokasi driver diperbarui' : 'Lokasi terakhir · menunggu pembaruan GPS'}</Text>
                <DriverLocationMap driver={driver} />
                {driver.recordedAt && <Text style={styles.statusText}>Pembaruan terakhir {new Date(driver.recordedAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</Text>}
                {destinationDistance !== null && <Text style={styles.statusText}>Jarak lurus ke alamat pengiriman: {destinationDistance < 1000 ? `${Math.round(destinationDistance)} m` : `${(destinationDistance / 1000).toFixed(1)} km`}</Text>}
              </> : <Text style={styles.statusText}>Driver sudah ditugaskan. Menunggu lokasi GPS pertama.</Text>}
            </> : <Text style={styles.statusText}>{order.status === 'ready_for_pickup' ? 'Pesanan siap. Menunggu penugasan driver.' : 'Lokasi akan muncul setelah driver ditugaskan dan mulai berbagi GPS.'}</Text>}
          </View>
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>{order.storeName}</Text>
            {order.items.map((item, index) => <View key={`${item.name}-${index}`} style={styles.orderItem}>
              <View style={styles.orderInfo}><Text style={styles.orderName}>{item.name}{item.variant ? ` · ${item.variant}` : ''}</Text><Text style={styles.orderQty}>{item.quantity} x {rupiah(item.unitPrice)}</Text></View>
              <Text style={styles.orderPrice}>{rupiah(item.unitPrice * item.quantity)}</Text>
            </View>)}
            <Text style={styles.statusText}>Alamat: {order.deliveryAddress}</Text>
            <View style={styles.divider} />
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.orderPrice}>{rupiah(order.subtotal)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Ongkos kirim</Text><Text style={styles.orderPrice}>{rupiah(order.shippingFee)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Biaya layanan</Text><Text style={styles.orderPrice}>{rupiah(order.serviceFee)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Diskon</Text><Text style={styles.orderPrice}>- {rupiah(order.discountAmount)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total pembayaran</Text><Text style={styles.total}>{rupiah(order.total)}</Text></View>
          </View>
          {order.status === 'cancelled' && order.cancellationReason ? <Text style={styles.cancelReason}>Alasan pembatalan: {order.cancellationReason}</Text> : null}
          <View style={styles.actionRow}>
            {['pending_payment', 'confirmed', 'pending'].includes(order.status) && order.paymentStatus !== 'success' ? <Pressable style={styles.secondaryButton} disabled={actionLoading} onPress={() => cancelOrder(order)}><Text style={styles.secondaryButtonText}>Batalkan</Text></Pressable> : null}
            {['completed', 'delivered', 'cancelled', 'payment_failed', 'rejected'].includes(order.status) ? <Pressable style={styles.primaryAction} disabled={actionLoading} onPress={() => void reorder(order)}><AppIcon name="refresh" size={17} color="#fff" /><Text style={styles.primaryActionText}>Pesan lagi</Text></Pressable> : null}
          </View>
          {['completed', 'delivered'].includes(order.status) && (
            <View style={styles.reviewCard}>
              <Text style={styles.orderTitle}>{order.review ? 'Ubah ulasan' : 'Bagaimana pesananmu?'}</Text>
              <Text style={styles.reviewLabel}>Makanan dari {order.storeName}</Text>
              <StarPicker value={foodRating} onChange={setFoodRating} />
              {order.driver ? <><Text style={styles.reviewLabel}>Pengantaran driver</Text><StarPicker value={deliveryRating} onChange={setDeliveryRating} /></> : null}
              <View style={styles.tagRow}>{['Enak', 'Porsi pas', 'Kemasan rapi', 'Cepat'].map((tag) => {
                const active = reviewTags.includes(tag);
                return <Pressable key={tag} style={[styles.tag, active && styles.tagActive]} onPress={() => setReviewTags((tags) => active ? tags.filter((item) => item !== tag) : [...tags, tag])}><Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text></Pressable>;
              })}</View>
              <TextInput value={reviewComment} onChangeText={setReviewComment} placeholder="Tulis pengalamanmu (opsional)" placeholderTextColor={COLORS.muted} multiline maxLength={500} style={styles.reviewInput} />
              <Pressable style={styles.primaryAction} disabled={actionLoading} onPress={() => void saveReview(order)}><Text style={styles.primaryActionText}>{actionLoading ? 'Menyimpan...' : 'Simpan ulasan'}</Text></Pressable>
            </View>
          )}
        </>}
        {!loading && !order && !error && <View style={styles.statusCard}><Text style={styles.statusText}>{orderId ? 'Pesanan tidak ditemukan atau tidak dapat diakses oleh akun ini.' : 'Belum ada pesanan untuk ditampilkan.'}</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return <View style={styles.stars}>{[1, 2, 3, 4, 5].map((rating) => <Pressable key={rating} onPress={() => onChange(rating)} accessibilityRole="button" accessibilityLabel={`${rating} bintang`}><AppIcon name={rating <= value ? 'star' : 'star-outline'} size={28} color="#F5A623" /></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F8' },
  content: { paddingHorizontal: 16, paddingBottom: 26, gap: 12 },
  loader: { marginTop: 40 },
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, ...SHADOW },
  statusIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAF8EF', alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  statusText: { marginTop: 3, fontSize: 10, color: COLORS.secondaryText },
  payButton: { minHeight: 46, paddingHorizontal: 14, borderRadius: 12, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  payButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepsCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 18, ...SHADOW },
  stepsRow: { flexDirection: 'row' },
  stepWrap: { flex: 1, minWidth: 0, alignItems: 'center', position: 'relative' },
  stepLabel: { fontSize: 11, lineHeight: 16, fontWeight: '700', color: COLORS.secondaryText, textAlign: 'center' },
  stepActiveText: { color: COLORS.primary },
  stepDot: { marginTop: 8, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#fff', backgroundColor: '#D5D5D5', zIndex: 2 },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.orange100 },
  stepLine: { position: 'absolute', height: 2, backgroundColor: '#E5E5E5', left: '50%', right: '-50%', bottom: 6 },
  stepLineActive: { backgroundColor: COLORS.primary },
  driverCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, ...SHADOW },
  driverDescription: { fontSize: 12, lineHeight: 18, color: COLORS.secondaryText },
  driverName: { marginTop: 12, fontSize: 14, fontWeight: '800', color: COLORS.text },
  locationState: { marginVertical: 10, fontSize: 11, fontWeight: '700', color: COLORS.success },
  locationStale: { color: COLORS.secondaryText },
  error: { padding: 12, color: COLORS.danger, fontSize: 12 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, ...SHADOW },
  orderTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  orderItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  orderInfo: { flex: 1, marginLeft: 9 },
  orderName: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  orderQty: { marginTop: 2, fontSize: 9, color: COLORS.muted },
  orderPrice: { fontSize: 11, fontWeight: '800', color: COLORS.text },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 9 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, fontWeight: '800', color: COLORS.text },
  total: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  cancelReason: { paddingHorizontal: 4, fontSize: 11, color: COLORS.secondaryText },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: { minHeight: 46, flex: 1, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: COLORS.danger, fontSize: 12, fontWeight: '900' },
  primaryAction: { minHeight: 46, flex: 1, borderRadius: 12, backgroundColor: COLORS.primary, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10, ...SHADOW },
  reviewLabel: { fontSize: 11, fontWeight: '800', color: COLORS.secondaryText },
  stars: { flexDirection: 'row', gap: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  tagActive: { borderColor: COLORS.primary, backgroundColor: COLORS.orange50 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.secondaryText },
  tagTextActive: { color: COLORS.primary },
  reviewInput: { minHeight: 84, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 11, textAlignVertical: 'top', fontSize: 12, color: COLORS.text },
});
