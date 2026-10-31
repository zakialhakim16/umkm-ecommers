import { Redirect,Stack } from 'expo-router';
import { IS_MERCHANT } from '@/lib/appVariant';

export default function SellerLayout() {
  if (!IS_MERCHANT) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
