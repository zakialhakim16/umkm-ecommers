import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { checkWelcomeSession, readVerifiedSession, type WelcomeSessionResult } from '@/lib/welcomeSession';

/** Do not mount home (or start its data requests) before verifying the account. */
export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<WelcomeSessionResult | 'checking'>('checking');
  const retry = useRef<() => void>(() => {});

  useFocusEffect(useCallback(() => {
    let cancel = () => {};
    const check = () => {
      cancel();
      setState('checking');
      cancel = checkWelcomeSession(() => readVerifiedSession(supabase.auth), setState);
    };
    retry.current = check;
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        cancel();
        setState('guest');
      }
    });
    return () => { cancel(); retry.current = () => {}; subscription.unsubscribe(); };
  }, []));

  if (state === 'guest') return <Redirect href="/" />;
  if (state === 'authenticated') return children;

  return <View style={styles.container}>
    {state === 'checking' && <ActivityIndicator color={COLORS.primary} />}
    <Text style={styles.title}>{state === 'checking' ? 'Memeriksa akun' : 'Koneksi akun belum tersedia'}</Text>
    <Text style={styles.description}>{state === 'checking' ? 'Beranda dibuka setelah sesi masuk terverifikasi.' : 'Periksa koneksi internet, lalu coba lagi atau kembali ke layar masuk.'}</Text>
    {state === 'unavailable' && <Pressable accessibilityRole="button" onPress={() => retry.current()} style={styles.button}><Text style={styles.buttonText}>Coba lagi</Text></Pressable>}
    <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}><Text style={styles.buttonText}>Kembali ke sambutan</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14, backgroundColor: '#FFFCF4' },
  title: { fontSize: 20, fontWeight: '800', color: '#453321', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 21, color: '#796B5E', textAlign: 'center', maxWidth: 340 },
  button: { minHeight: 48, padding: 14, justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
});
