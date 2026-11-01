import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { WelcomeGlyph } from '@/components/WelcomeGlyph';
import { WelcomeMascot, useWelcomeMotion } from '@/components/WelcomeMascot';
import { COLORS } from '@/constants/theme';
import { parseRecoveryLink, recoveryRedirectUrl } from '@/lib/passwordRecovery';
import { useHydrated } from '@/hooks/useHydrated';
import { supabase } from '@/lib/supabase';
import { APP_HOME, APP_NAME, APP_VARIANT } from '@/lib/appVariant';
import { checkWelcomeSession, readVerifiedSession, type WelcomeSessionResult } from '@/lib/welcomeSession';

const STORIES = {
  consumer: [
    { tag: 'KENALAN DULU, YUK', title: 'Rasa enak.\nCerita dekat.', detail: 'Temukan makanan favorit dari dapur lokal. Aku si Rasa, temanmu kalau lagi lapar!', icon: 'restaurant', benefit: 'Banyak rasa, satu rumah' },
    { tag: 'KECIL TOKONYA, BESAR RASANYA', title: 'Jajan lokal,\nsenangnya dobel.', detail: 'Kamu kenyang, usaha tetangga ikut berkembang. Selalu ada menu baru untuk dicoba.', icon: 'heart', benefit: 'Dukung UMKM di kotamu' },
    { tag: 'TINGGAL PILIH, LALU NIKMATI', title: 'Dari dapur,\nsampai depan pintu.', detail: 'Pilih menu, buat pesanan, dan pantau perjalanan makananmu lewat aplikasi.', icon: 'bicycle', benefit: 'Pantau pesanan dengan mudah' },
  ],
  merchant: [
    { tag: 'SELAMAT DATANG, MITRA', title: 'Dapur kecil.\nPeluang besar.', detail: 'Kenalkan menu andalanmu ke lebih banyak pelanggan bersama RasaLokal Mitra.', icon: 'storefront', benefit: 'Rumah untuk usaha lokal' },
    { tag: 'MENU ANDALAN, SIAP TAMPIL', title: 'Racikanmu,\nfavorit mereka.', detail: 'Lengkapi profil toko, tampilkan menu, dan atur ketersediaan produk dari aplikasi.', icon: 'restaurant', benefit: 'Kelola menu dalam satu tempat' },
    { tag: 'SETIAP PESANAN BERARTI', title: 'Masak sepenuh hati.\nKelola lebih rapi.', detail: 'Terima dan proses pesanan pelanggan, lalu siapkan makanan untuk dijemput driver.', icon: 'receipt', benefit: 'Pesanan lebih teratur' },
  ],
  driver: [
    { tag: 'HALO, TEMAN PERJALANAN', title: 'Antar rasa.\nBawa cerita.', detail: 'Bergabung sebagai mitra driver dan bantu kuliner lokal sampai ke pelanggan.', icon: 'bicycle', benefit: 'Jadi bagian dari RasaLokal' },
    { tag: 'SIAPKAN LANGKAH PERTAMA', title: 'Kenalan dulu,\nlalu melaju.', detail: 'Buat akun dan lengkapi data kendaraanmu untuk proses peninjauan oleh admin.', icon: 'person', benefit: 'Pendaftaran dalam aplikasi' },
    { tag: 'DARI JEMPUT HINGGA SAMPAI', title: 'Setiap antar,\nada senyuman.', detail: 'Lihat tugas pengantaran dan perbarui perjalanan pesananmu dengan mudah.', icon: 'location', benefit: 'Tugas pengiriman lebih jelas' },
  ],
} as const;
const GREETINGS = ['Halo! Aku si Rasa.', 'Wah, senang ketemu kamu!', 'Yuk, mulai cerita kita!'];

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hydrated = useHydrated();
  const recoveryLink = parseRecoveryLink(params);
  const motion = useWelcomeMotion();
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 780 || fontScale > 1.2;
  const [sessionState, setSessionState] = useState<WelcomeSessionResult | 'checking'>('checking');
  const stopSessionCheck = useRef<() => void>(() => {});
  const navigationStarted = useRef(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const story = STORIES[APP_VARIANT][storyIndex];

  const startSessionCheck = useCallback(() => {
    if (!hydrated || recoveryLink.kind !== 'none') return;
    stopSessionCheck.current();
    navigationStarted.current = false;
    setSessionState('checking');
    const cancel = checkWelcomeSession(() => readVerifiedSession(supabase.auth), result => {
      if (navigationStarted.current) return;
      setSessionState(result);
    });
    stopSessionCheck.current = cancel;
    return () => stopSessionCheck.current();
  }, [hydrated, recoveryLink.kind]);
  useFocusEffect(startSessionCheck);

  if (hydrated && recoveryLink.kind !== 'none') {
    return <Redirect href={recoveryRedirectUrl(params)} />;
  }

  const openAuthentication = (authMode: 'signIn' | 'signUp') => {
    if (navigationStarted.current) return;
    navigationStarted.current = true;
    stopSessionCheck.current();
    router.push({ pathname: '/account-details', params: { section: 'login', authMode, returnTo: APP_HOME } });
  };
  const continueSession = () => {
    if (navigationStarted.current || sessionState !== 'authenticated') return;
    navigationStarted.current = true;
    stopSessionCheck.current();
    router.replace(APP_HOME as never);
  };
  const changeStory = (index: number) => { setStoryIndex(index); setGreetingIndex(0); };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.brandMark}><WelcomeGlyph name="bowl" color={COLORS.primaryDark} /></View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <View style={styles.localPill}><View style={styles.liveDot} /><Text style={styles.localPillText}>DARI LOKAL</Text></View>
        </View>

        <View style={[styles.hero, compact && { marginTop: 18 }]}>
          <View style={styles.greetingBubble}><Text style={styles.greeting} accessibilityLiveRegion="polite">{GREETINGS[greetingIndex]}</Text><View style={styles.bubblePointer} /></View>
          <WelcomeMascot motion={motion} size={compact ? 190 : 230} onGreet={() => setGreetingIndex(current => (current + 1) % GREETINGS.length)} />
          <Text style={styles.tapHint}>Ketuk si Rasa untuk menyapa</Text>
        </View>

        <View style={[styles.story, compact && { marginTop: 16 }]}>
          <Text style={styles.eyebrow}>{story.tag}</Text>
          <Text style={[styles.title, compact && { fontSize: 30, lineHeight: 34 }]}>{story.title}</Text>
          <Text style={styles.description}>{story.detail}</Text>
          {!compact && <View style={styles.benefit}><Text style={styles.benefitText}>{story.benefit}</Text></View>}
        </View>

        <View style={styles.storyControls}>
          <View style={styles.dots}>{STORIES[APP_VARIANT].map((item, index) => <Pressable key={item.tag} accessibilityRole="button" accessibilityLabel={`Cerita ${index + 1}`} accessibilityState={{ selected: storyIndex === index }} onPress={() => changeStory(index)} style={styles.dotTouch}><View style={[styles.dot, storyIndex === index && styles.dotActive]} /></Pressable>)}</View>
          <Pressable onPress={() => changeStory((storyIndex + 1) % STORIES[APP_VARIANT].length)} accessibilityRole="button" accessibilityLabel="Cerita berikutnya" style={styles.next}><Text style={styles.nextText}>Lanjut</Text><WelcomeGlyph /></Pressable>
        </View>

        <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Daftar akun RasaLokal" onPress={() => openAuthentication('signUp')} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}><Text style={styles.primaryText}>MULAI SEKARANG</Text><WelcomeGlyph color="#fff" /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Masuk ke akun RasaLokal" onPress={() => openAuthentication('signIn')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}><Text style={styles.secondaryText}>SUDAH PUNYA AKUN? MASUK</Text></Pressable>
            {sessionState === 'authenticated' && <View style={styles.sessionNotice}><Text style={styles.sessionText}>Ada akun yang masih masuk di perangkat ini.</Text><Pressable accessibilityRole="button" onPress={continueSession} style={styles.retry}><Text style={styles.retryText}>Lanjutkan dengan akun tersimpan</Text></Pressable></View>}
            {sessionState === 'checking' && <View style={styles.session} accessibilityLiveRegion="polite"><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.sessionText}>Memeriksa sesi sebelumnya…</Text></View>}
            {sessionState === 'unavailable' && <View style={styles.sessionNotice}><Text style={styles.sessionText}>Sesi belum dapat diperiksa. Kamu tetap bisa memilih Masuk atau Daftar.</Text><Pressable accessibilityRole="button" onPress={() => { startSessionCheck(); }} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable></View>}
        </View>
        <Text style={styles.footer}>Kuliner lokal. Teman setiap hari.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFCF4' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  shell: { width: '100%', maxWidth: 440, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandMark: { height: 34, width: 34, borderRadius: 12, backgroundColor: '#FFE9D1', alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, fontSize: 19, fontWeight: '900', color: '#453321', letterSpacing: -0.5 },
  localPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#E3E9D5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 }, liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#7DA95A' }, localPillText: { fontSize: 7, letterSpacing: 1, fontWeight: '800', color: '#6A8050' },
  hero: { alignItems: 'center', marginTop: 26 }, greetingBubble: { minHeight: 43, paddingHorizontal: 19, paddingVertical: 11, borderRadius: 16, borderWidth: 2, borderColor: '#E8E5D7', backgroundColor: '#fff', justifyContent: 'center', marginBottom: 2 }, greeting: { fontSize: 14, fontWeight: '800', color: '#675640', textAlign: 'center' }, bubblePointer: { position: 'absolute', bottom: -7, left: '47%', height: 12, width: 12, backgroundColor: '#fff', borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#E8E5D7', transform: [{ rotate: '45deg' }] },
  tapHint: { marginTop: -3, fontSize: 10, color: '#A49B88' },
  story: { alignItems: 'center', marginTop: 22 }, eyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: '#B18C5D', textAlign: 'center' }, title: { fontSize: 33, lineHeight: 37, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center', color: '#423321', marginTop: 8 }, description: { marginTop: 12, fontSize: 13, lineHeight: 20, color: '#8A7C65', textAlign: 'center', maxWidth: 330 }, benefit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15, backgroundColor: '#F0F4E5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }, benefitText: { fontSize: 10, fontWeight: '700', color: '#637E4D' },
  storyControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16, minHeight: 44 }, dots: { flexDirection: 'row', alignItems: 'center' }, dotTouch: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#DDD9C8' }, dotActive: { width: 23, backgroundColor: '#EF9350' }, next: { minHeight: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#EAE4D6', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, nextText: { fontSize: 11, fontWeight: '700', color: '#796B5E' },
  actions: { gap: 10, paddingTop: 4 }, primaryButton: { minHeight: 55, borderRadius: 17, backgroundColor: '#EB7C30', borderBottomWidth: 5, borderColor: '#C55D1C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12 }, primaryPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 }, secondaryButton: { minHeight: 54, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E8E2D4', backgroundColor: '#fff', borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 }, secondaryPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 }, secondaryText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, color: '#A06C3E', textAlign: 'center' }, browseButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }, browseText: { fontSize: 11, color: '#796B5E', fontWeight: '600' },
  session: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 25 }, sessionText: { fontSize: 11, lineHeight: 17, color: '#796B5E', textAlign: 'center' }, sessionNotice: { backgroundColor: '#F3F0E5', borderRadius: 14, padding: 12 }, retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, retryText: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark }, footer: { marginTop: 8, fontSize: 10, color: '#8C7E70', textAlign: 'center' },
});
