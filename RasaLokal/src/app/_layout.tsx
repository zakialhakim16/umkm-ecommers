import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 320, contentStyle: { backgroundColor: '#F8F6F3' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="payment" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracking" options={{ animation: 'fade' }} />
        <Stack.Screen name="driver" />
        <Stack.Screen name="driver-register" />
        <Stack.Screen name="location" />
        <Stack.Screen name="account-details" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="seller" />
      </Stack>
    </GestureHandlerRootView>
  );
}
