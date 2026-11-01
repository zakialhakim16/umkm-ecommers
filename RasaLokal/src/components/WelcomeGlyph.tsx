import { StyleSheet, View } from 'react-native';

/** Critical welcome controls render offline without a downloadable symbol font. */
export function WelcomeGlyph({ name = 'arrow', color = '#796B5E' }: { name?: 'arrow' | 'bowl'; color?: string }) {
  return <View style={styles.box} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {name === 'bowl' ? <>
      <View style={[styles.bowl, { backgroundColor: color }]} />
      <View style={[styles.rim, { backgroundColor: color }]} />
      <View style={[styles.steam, { backgroundColor: color }]} />
      <View style={[styles.steam, { backgroundColor: color, left: 12, top: 1 }]} />
    </> : <>
      <View style={[styles.shaft, { backgroundColor: color }]} />
      <View style={[styles.head, { borderColor: color }]} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  box: { width: 22, height: 22 },
  shaft: { position: 'absolute', width: 16, height: 2, top: 10, left: 2, borderRadius: 1 },
  head: { position: 'absolute', width: 9, height: 9, borderTopWidth: 2, borderRightWidth: 2, top: 6.5, left: 10, transform: [{ rotate: '45deg' }] },
  bowl: { position: 'absolute', width: 18, height: 10, left: 2, top: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  rim: { position: 'absolute', width: 22, height: 3, left: 0, top: 9, borderRadius: 2 },
  steam: { position: 'absolute', width: 2, height: 5, left: 7, top: 2, borderRadius: 2, transform: [{ rotate: '15deg' }] },
});
