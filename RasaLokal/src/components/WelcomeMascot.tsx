import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useWelcomeMotion() {
  // Remain still until the device preference is known, including during server rendering.
  const [reduced, setReduced] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => {});
    const preference = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const visibility = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => { mounted = false; preference?.remove(); visibility.remove(); };
  }, []);
  return !reduced && foreground;
}

// Original RasaLokal character drawn with native shapes: a cheerful bowl with a chef's hat.
// No remote image, animation download or native dependency is needed before login.
export function WelcomeMascot({ onGreet, motion, size = 300 }: { onGreet: () => void; motion: boolean; size?: number }) {
  const [float] = useState(() => new Animated.Value(0));
  const [blink] = useState(() => new Animated.Value(1));
  const [wave] = useState(() => new Animated.Value(0));
  const [cheer] = useState(() => new Animated.Value(0));

  useFocusEffect(useCallback(() => {
    if (!motion) return;
    const bobbing = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    const blinking = Animated.loop(Animated.sequence([
      Animated.delay(2800),
      Animated.timing(blink, { toValue: 0.08, duration: 100, useNativeDriver: true, isInteraction: false }),
      Animated.timing(blink, { toValue: 1, duration: 130, useNativeDriver: true, isInteraction: false }),
      Animated.delay(1700),
    ]));
    const waving = Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(wave, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(wave, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(wave, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.delay(2600),
    ]));
    bobbing.start(); blinking.start(); waving.start();
    return () => {
      bobbing.stop(); blinking.stop(); waving.stop(); cheer.stopAnimation();
      float.setValue(0); blink.setValue(1); wave.setValue(0); cheer.setValue(0);
    };
  }, [motion, float, blink, wave, cheer]));

  const greet = () => {
    onGreet();
    if (!motion) return;
    cheer.stopAnimation();
    cheer.setValue(0);
    Animated.spring(cheer, { toValue: 1, tension: 65, friction: 6, useNativeDriver: true, isInteraction: false }).start();
  };

  return <Pressable onPress={greet} accessibilityRole="button" accessibilityLabel="Sapa Si Rasa" accessibilityHint="Ketuk untuk melihat sapaan dari maskot RasaLokal" style={{ width: size, height: size, alignSelf: 'center' }}>
    <View pointerEvents="none" style={[styles.stage, { position: 'absolute', top: (size - 300) / 2, left: (size - 300) / 2, transform: [{ scale: size / 300 }] }]}>
    <View style={styles.backdrop} />
    <View style={[styles.sparkle, styles.sparkleLeft]} /><View style={[styles.sparkle, styles.sparkleRight]} />
    <View style={styles.tinyDot} /><View style={styles.tinyDotRight} />
    <Animated.View style={[styles.shadow, { transform: [{ scaleX: float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] }) }], opacity: float.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.1] }) }]} />
    <Animated.View testID="mascot-float" style={[styles.character, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) }, { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) }] }]}>
      <Animated.View style={[styles.characterInner, { transform: [{ translateY: cheer.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, -26, 0] }) }, { scale: cheer.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.06, 1] }) }] }]}>
        <View style={styles.leftFoot} /><View style={styles.rightFoot} />
        <View style={styles.leftArm} />
        <Animated.View style={[styles.rightArm, { transform: [{ rotate: wave.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '16deg'] }) }] }]}><View style={styles.finger} /></Animated.View>
        <View style={styles.bowl}>
          <View style={styles.bowlShine} />
          <View style={styles.face}>
            <Animated.View testID="mascot-eyes" style={[styles.eyes, { transform: [{ scaleY: blink }] }]}>
              <View style={styles.eye}><View style={styles.pupil}><View style={styles.eyeShine} /></View></View>
              <View style={styles.eye}><View style={styles.pupil}><View style={styles.eyeShine} /></View></View>
            </Animated.View>
            <View style={styles.leftCheek} /><View style={styles.rightCheek} />
            <View style={styles.smile}><View style={styles.tongue} /></View>
          </View>
          <View style={styles.apron}><View style={styles.apronPocket} /></View>
        </View>
        <View style={styles.bowlRim} />
        <View style={styles.hat}>
          <View style={styles.hatBase} /><View style={styles.hatLeft} /><View style={styles.hatCenter} /><View style={styles.hatRight} />
          <View style={styles.hatBand} />
          <View style={styles.leafLeft} /><View style={styles.leafRight} />
        </View>
      </Animated.View>
    </Animated.View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  stage: { width: 300, height: 300, alignSelf: 'center' }, backdrop: { width: 250, height: 250, borderRadius: 125, backgroundColor: '#EAF0DA', position: 'absolute', left: 25, top: 20 },
  sparkle: { position: 'absolute', width: 16, height: 16, backgroundColor: '#EFCB75', transform: [{ rotate: '45deg' }], borderRadius: 4 }, sparkleLeft: { left: 22, top: 69 }, sparkleRight: { right: 13, top: 181, width: 12, height: 12 }, tinyDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#C6D796', top: 207, left: 20 }, tinyDotRight: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#EEC994', top: 43, right: 34 },
  shadow: { position: 'absolute', left: 68, bottom: 13, width: 165, height: 19, borderRadius: 80, backgroundColor: '#51734A' }, character: { position: 'absolute', left: 30, top: 15, width: 240, height: 265 }, characterInner: { width: 240, height: 265 },
  leftFoot: { position: 'absolute', width: 47, height: 23, borderRadius: 15, backgroundColor: '#A74B26', left: 60, bottom: 6, transform: [{ rotate: '-8deg' }] }, rightFoot: { position: 'absolute', width: 47, height: 23, borderRadius: 15, backgroundColor: '#A74B26', right: 60, bottom: 6, transform: [{ rotate: '8deg' }] },
  leftArm: { position: 'absolute', left: 12, top: 150, width: 39, height: 65, borderRadius: 24, backgroundColor: '#F5933E', transform: [{ rotate: '33deg' }] }, rightArm: { position: 'absolute', right: 3, top: 114, width: 36, height: 74, borderRadius: 23, backgroundColor: '#F5933E' }, finger: { position: 'absolute', left: -8, top: 12, width: 16, height: 27, borderRadius: 10, backgroundColor: '#F5933E', transform: [{ rotate: '-24deg' }] },
  bowl: { position: 'absolute', top: 113, left: 28, width: 184, height: 132, backgroundColor: '#F48132', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 74, borderBottomRightRadius: 74, borderBottomWidth: 8, borderBottomColor: '#DD6826', overflow: 'hidden' }, bowlShine: { position: 'absolute', top: 15, left: 10, height: 35, width: 13, borderRadius: 8, backgroundColor: '#FFAC66', transform: [{ rotate: '-12deg' }] }, bowlRim: { position: 'absolute', top: 110, left: 23, width: 194, height: 18, borderRadius: 9, backgroundColor: '#FFC473', borderBottomWidth: 4, borderBottomColor: '#E9A14D' },
  face: { position: 'absolute', top: 26, left: 25, width: 134, height: 72 }, eyes: { flexDirection: 'row', justifyContent: 'center', gap: 14 }, eye: { width: 34, height: 40, borderRadius: 19, backgroundColor: '#FFFDF3', alignItems: 'center', justifyContent: 'center' }, pupil: { width: 17, height: 25, borderRadius: 11, backgroundColor: '#482F20', marginLeft: 6, marginTop: 3 }, eyeShine: { width: 7, height: 8, borderRadius: 4, backgroundColor: '#fff', position: 'absolute', top: 3, right: 2 }, leftCheek: { position: 'absolute', left: 0, top: 37, width: 23, height: 11, borderRadius: 12, backgroundColor: '#EB6050', opacity: 0.65 }, rightCheek: { position: 'absolute', right: 0, top: 37, width: 23, height: 11, borderRadius: 12, backgroundColor: '#EB6050', opacity: 0.65 }, smile: { position: 'absolute', top: 46, left: 49, width: 36, height: 22, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: '#673823', overflow: 'hidden' }, tongue: { position: 'absolute', width: 26, height: 16, borderRadius: 13, backgroundColor: '#F49788', top: 13, left: 6 },
  apron: { position: 'absolute', width: 64, height: 27, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#FFF0CF', bottom: -4, left: 60 }, apronPocket: { width: 24, height: 12, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 2, borderColor: '#E9CA9C', alignSelf: 'center', marginTop: 7 },
  hat: { position: 'absolute', top: 19, left: 44, width: 154, height: 94, transform: [{ rotate: '-5deg' }] }, hatBase: { position: 'absolute', bottom: 0, left: 22, width: 110, height: 65, backgroundColor: '#FFFDF5', borderRadius: 17 }, hatLeft: { position: 'absolute', top: 10, left: 0, width: 64, height: 62, borderRadius: 34, backgroundColor: '#FFFDF5' }, hatCenter: { position: 'absolute', top: -4, left: 39, width: 74, height: 76, borderRadius: 40, backgroundColor: '#FFFDF5' }, hatRight: { position: 'absolute', top: 12, right: 0, width: 64, height: 62, borderRadius: 34, backgroundColor: '#FFFDF5' }, hatBand: { position: 'absolute', bottom: 0, left: 22, width: 110, height: 15, borderRadius: 5, backgroundColor: '#EEE5D4' }, leafLeft: { position: 'absolute', left: 67, top: 47, width: 12, height: 23, borderTopLeftRadius: 15, borderBottomRightRadius: 15, backgroundColor: '#549257', transform: [{ rotate: '-23deg' }] }, leafRight: { position: 'absolute', left: 78, top: 43, width: 12, height: 23, borderTopRightRadius: 15, borderBottomLeftRadius: 15, backgroundColor: '#82AF65', transform: [{ rotate: '25deg' }] },
});
