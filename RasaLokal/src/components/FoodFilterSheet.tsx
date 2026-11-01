import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { COLORS } from '@/constants/theme';
import { DEFAULT_FILTERS, FOOD_CATEGORIES, type DiscoveryFilters } from '@/lib/discovery';

// Mounted on opening so cancelling discards the draft and reopening reflects applied filters.
export function FoodFilterSheet({ value, hasLocation, onApply, onClose }: {
  value: DiscoveryFilters; hasLocation: boolean; onApply: (filters: DiscoveryFilters) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return <Modal transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup filter" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.heading}><Text style={styles.title}>Sesuai seleramu</Text><Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Tutup filter"><AppIcon name="close" size={22} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Kategori menu</Text><View style={styles.options}>{FOOD_CATEGORIES.map(category => <Option key={category} label={category} selected={draft.category === category} onPress={() => setDraft({ ...draft, category })} />)}</View>
          <Text style={styles.label}>Harga menu maksimal</Text><View style={styles.options}>{[null, 15000, 25000, 50000].map(maxPrice => <Option key={String(maxPrice)} label={maxPrice === null ? 'Semua harga' : `${maxPrice / 1000} ribu`} selected={draft.maxPrice === maxPrice} onPress={() => setDraft({ ...draft, maxPrice })} />)}</View>
          <Text style={styles.label}>Jarak dari alamatmu</Text>
          {!hasLocation && <Text style={styles.help}>Simpan titik alamat pengiriman untuk memakai filter jarak.</Text>}
          <View style={styles.options}>{[null, 1, 3, 5].map(radiusKm => <Option key={String(radiusKm)} label={radiusKm === null ? 'Semua jarak' : `${radiusKm} km`} disabled={!hasLocation && radiusKm !== null} selected={draft.radiusKm === radiusKm} onPress={() => setDraft({ ...draft, radiusKm })} />)}</View>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.openOnly }} style={styles.toggle} onPress={() => setDraft({ ...draft, openOnly: !draft.openOnly })}><Text style={styles.label}>Hanya resto yang buka</Text><AppIcon name={draft.openOnly ? 'checkbox' : 'checkbox-outline'} color={COLORS.primary} /></Pressable>
        </ScrollView>
        <View style={styles.footer}><Pressable onPress={() => setDraft({ ...DEFAULT_FILTERS })} style={styles.reset}><Text style={styles.resetText}>Reset</Text></Pressable><Pressable onPress={() => onApply(draft)} style={styles.apply}><Text style={styles.applyText}>Tampilkan pilihan</Text></Pressable></View>
      </SafeAreaView>
    </View>
  </Modal>;
}

function Option({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ selected, disabled }} style={[styles.option, selected && styles.selected, disabled && { opacity: 0.4 }]}><Text style={[styles.optionText, selected && { color: COLORS.primaryDark }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#21171170', justifyContent: 'flex-end', alignItems: 'center' }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 600, maxHeight: '90%' },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 12 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }, title: { fontSize: 22, fontWeight: '900', color: COLORS.text }, close: { padding: 8 },
  content: { paddingHorizontal: 20 }, label: { fontSize: 14, fontWeight: '800', color: COLORS.text }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 26 }, option: { paddingHorizontal: 15, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border }, selected: { backgroundColor: COLORS.orange50, borderColor: COLORS.primary }, optionText: { fontSize: 12, fontWeight: '700', color: COLORS.secondaryText }, help: { marginTop: 8, fontSize: 12, lineHeight: 18, color: COLORS.secondaryText }, toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50 }, footer: { flexDirection: 'row', gap: 12, padding: 20 }, reset: { paddingHorizontal: 22, justifyContent: 'center', minHeight: 48 }, resetText: { fontSize: 14, fontWeight: '800', color: COLORS.secondaryText }, apply: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 16, minHeight: 48, justifyContent: 'center', alignItems: 'center' }, applyText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
