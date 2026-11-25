import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';

const SIZE = 232;
const PARTICLES = 16;
const PARTICLES_PALIER = 30;
const BURST_COLORS = ['#FF6B4A', '#F5B93B', '#2FA66A', '#7AA7FF', '#FF9EC4'];

interface Props {
  taken: boolean;
  time: string | null;
  /** Incrémenté à chaque prise pour rejouer l'explosion. */
  burstKey: number;
  big: boolean;
  reduceMotion: boolean;
  theme: Theme;
  onPress: () => void;
}

export function PillButton({ taken, time, burstKey, big, reduceMotion, theme, onPress }: Props) {
  const press = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const done = useRef(new Animated.Value(taken ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  // Respiration douce tant que ce n'est pas pris : attire l'œil sans crier.
  useEffect(() => {
    if (taken || reduceMotion) {
      breathe.stopAnimation();
      breathe.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [taken, reduceMotion, breathe]);

  useEffect(() => {
    if (reduceMotion) {
      done.setValue(taken ? 1 : 0);
      return;
    }
    Animated.spring(done, { toValue: taken ? 1 : 0, friction: 6, tension: 120, useNativeDriver: true }).start();
  }, [taken, reduceMotion, done]);

  useEffect(() => {
    if (burstKey === 0 || reduceMotion) return;
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: big ? 1100 : 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burstKey, big, reduceMotion, burst]);

  const haloScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.12] });
  const checkScale = done.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const idleOpacity = done.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });

  const count = big ? PARTICLES_PALIER : PARTICLES;
  const reach = big ? 190 : 150;

  return (
    <View style={styles.wrap}>
      {/* Halo qui respire */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          { backgroundColor: theme.coral, opacity: taken ? 0 : haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={taken ? `Pris aujourd'hui à ${time}` : 'J’ai pris ma pilule'}
        accessibilityState={{ checked: taken }}
        disabled={taken}
        onPressIn={() => Animated.spring(press, { toValue: 0.93, friction: 7, tension: 300, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start()}
        onPress={onPress}
      >
        <Animated.View style={[styles.circle, { backgroundColor: theme.coral, transform: [{ scale: press }] }]}>
          {/* Couche verte « pris » par-dessus */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.circleInner, { backgroundColor: theme.green, opacity: done }]} />

          <Animated.View style={[styles.center, { opacity: idleOpacity }]}>
            <Text style={styles.emoji}>💊</Text>
            <Text style={styles.label}>J’ai pris</Text>
          </Animated.View>

          <Animated.View style={[styles.center, StyleSheet.absoluteFill, { opacity: done, transform: [{ scale: checkScale }] }]}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.sub}>{time ? `Pris à ${time}` : 'Pris'}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
      {/* Confettis */}
      {burstKey > 0 &&
        Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
          const dist = reach * (0.75 + ((i * 37) % 25) / 100);
          const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
          const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
          const opacity = burst.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] });
          const scale = burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.6] });
          const s = big ? 12 + (i % 3) * 3 : 9 + (i % 3) * 2;
          return (
            <Animated.View
              key={`${burstKey}-${i}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: s,
                height: i % 4 === 0 ? s * 2 : s,
                borderRadius: i % 4 === 0 ? 3 : s / 2,
                backgroundColor: BURST_COLORS[i % BURST_COLORS.length],
                opacity,
                transform: [{ translateX: tx }, { translateY: ty }, { scale }, { rotate: `${(i * 47) % 360}deg` }],
              }}
            />
          );
        })}

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE + 80, height: SIZE + 80, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: SIZE + 44, height: SIZE + 44, borderRadius: (SIZE + 44) / 2 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  circleInner: { borderRadius: SIZE / 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 46, marginBottom: 4 },
  label: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  check: { fontSize: 84, fontWeight: '800', color: '#FFFFFF', lineHeight: 92 },
  sub: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', opacity: 0.92 },
});
