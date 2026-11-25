import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState as RNAppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { commit } from './src/actions';
import { Calendar } from './src/components/Calendar';
import { PillButton } from './src/components/PillButton';
import { SettingsSheet } from './src/components/SettingsSheet';
import { dayKey, formatLongDate, formatTime } from './src/dates';
import { bravo, bravoPalier, enAttente } from './src/messages';
import { ACTION_TAKE, ensurePermission, setupNotifications } from './src/notifications';
import { DEFAULT_SETTINGS, loadState, type AppState, type Settings } from './src/storage';
import { computeStats, isPalier, PALIERS, JOKERS_MAX, JOURS_POUR_JOKER } from './src/streak';
import { useTheme, type Theme } from './src/theme';
import { pinWidget } from './src/widgetSync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <Home />
    </SafeAreaProvider>
  );
}

function Home() {
  const theme = useTheme();
  const [state, setState] = useState<AppState>({ taken: {}, settings: DEFAULT_SETTINGS });
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(dayKey());
  const [burstKey, setBurstKey] = useState(0);
  const [bigBurst, setBigBurst] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifGranted, setNotifGranted] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const reload = useCallback(async () => {
    const s = await loadState();
    setState(s);
    setToday(dayKey());
    setLoaded(true);
    return s;
  }, []);

  // Démarrage : état, canal, permission, programmation.
  useEffect(() => {
    (async () => {
      const s = await reload();
      await setupNotifications().catch(() => {});
      setNotifGranted(await ensurePermission().catch(() => false));
      await commit(s);
    })();
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, [reload]);

  // Retour au premier plan : le widget ou la notif ont pu cocher, et le jour a pu changer.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') {
        reload();
        Notifications.getPermissionsAsync().then((p) => setNotifGranted(p.granted)).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [reload]);

  const stats = useMemo(() => computeStats(state.taken, today), [state.taken, today]);
  const takenIso = state.taken[today];

  const apply = useCallback((next: AppState) => {
    setState(next); // optimiste : l'écran réagit tout de suite
    commit(next).catch(() => {});
  }, []);

  const take = useCallback(() => {
    const cur = stateRef.current;
    const key = dayKey();
    if (cur.taken[key]) return;
    const next = { ...cur, taken: { ...cur.taken, [key]: new Date().toISOString() } };
    const after = computeStats(next.taken, key);
    const palier = isPalier(after.streak);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setToday(key);
    setBigBurst(palier);
    setBurstKey((k) => k + 1);
    setMessage(palier ? bravoPalier(after.streak) : bravo(after.streak));
    apply(next);
    Notifications.dismissAllNotificationsAsync().catch(() => {});
  }, [apply]);

  // Bouton de la notif quand l'app est ouverte.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      if (r.actionIdentifier === ACTION_TAKE) take();
    });
    return () => sub.remove();
  }, [take]);

  const undoToday = useCallback(() => {
    const cur = stateRef.current;
    const taken = { ...cur.taken };
    delete taken[today];
    Haptics.selectionAsync().catch(() => {});
    setMessage(null);
    apply({ ...cur, taken });
  }, [apply, today]);

  const toggleDay = useCallback(
    (key: string) => {
      if (key === today) {
        if (stateRef.current.taken[key]) undoToday();
        else take();
        return;
      }
      const cur = stateRef.current;
      const taken = { ...cur.taken };
      if (taken[key]) delete taken[key];
      else taken[key] = `${key}T12:00:00`;
      Haptics.selectionAsync().catch(() => {});
      apply({ ...cur, taken });
    },
    [apply, take, today, undoToday],
  );

  const changeSettings = useCallback(
    (settings: Settings) => {
      Haptics.selectionAsync().catch(() => {});
      apply({ ...stateRef.current, settings });
    },
    [apply],
  );

  const onPinWidget = useCallback(async () => {
    const ok = await pinWidget();
    if (!ok && Platform.OS === 'android') {
      ToastAndroid.show('Appui long sur l’écran d’accueil → Widgets → Pilules de bonheur', ToastAndroid.LONG);
    }
  }, []);

  const hour = new Date().getHours();
  const subtitle = stats.todayTaken
    ? (message ?? (stats.streak > 1 ? `${stats.streak} jours d’affilée. Tranquille.` : 'C’est fait pour aujourd’hui.'))
    : enAttente(stats.streak, hour);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: theme.coral }]}>Pilules de bonheur</Text>
            <Text style={[styles.date, { color: theme.ink }]}>{formatLongDate()}</Text>
          </View>
          <Pressable
            onPress={() => setSettingsOpen(true)}
            accessibilityLabel="Réglages"
            hitSlop={10}
            style={({ pressed }) => [styles.gear, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.gearText}>⚙️</Text>
          </Pressable>
        </View>

        <View style={[styles.hero, { opacity: loaded ? 1 : 0 }]}>
          <PillButton
            taken={stats.todayTaken}
            time={takenIso ? formatTime(takenIso) : null}
            burstKey={burstKey}
            big={bigBurst}
            reduceMotion={reduceMotion}
            theme={theme}
            onPress={take}
          />
          <Text style={[styles.subtitle, { color: theme.ink }]}>{subtitle}</Text>
          {stats.todayTaken ? (
            <Pressable onPress={undoToday} hitSlop={12} accessibilityLabel="Annuler la prise d’aujourd’hui">
              <Text style={[styles.undo, { color: theme.muted }]}>Annuler</Text>
            </Pressable>
          ) : (
            <Text style={[styles.undo, { color: theme.muted }]}>
              Rappel à {formatTimeHM(state.settings.morning)}, relance à {formatTimeHM(state.settings.noon)}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatCard theme={theme} emoji="🔥" value={stats.streak} label={stats.streak > 1 ? 'jours de série' : 'jour de série'} bump={burstKey} reduceMotion={reduceMotion} />
          <StatCard theme={theme} emoji="🏆" value={stats.best} label="record" />
          <StatCard
            theme={theme}
            emoji="🃏"
            value={stats.jokers}
            label={stats.jokers >= JOKERS_MAX ? 'jokers (max)' : `joker${stats.jokers > 1 ? 's' : ''} · +1 dans ${JOURS_POUR_JOKER - stats.jokerProgress} j`}
          />
        </View>

        {stats.nextPalier && <PalierCard theme={theme} streak={stats.streak} next={stats.nextPalier} />}

        <Card theme={theme} title="Ces 5 dernières semaines">
          <Calendar today={today} status={stats.status} theme={theme} onToggle={toggleDay} />
        </Card>

        <Card theme={theme} title={`Badges · ${stats.total} prise${stats.total > 1 ? 's' : ''} au total`}>
          <View style={styles.badges}>
            {PALIERS.map((p) => {
              const on = stats.best >= p;
              return (
                <View key={p} style={[styles.badge, { backgroundColor: on ? theme.coral : theme.future, borderColor: on ? theme.coral : theme.line }]}>
                  <Text style={[styles.badgeText, { color: on ? '#FFFFFF' : theme.muted }]}>{on ? '★ ' : ''}{p} j</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      <SettingsSheet
        visible={settingsOpen}
        settings={state.settings}
        notifGranted={notifGranted}
        theme={theme}
        onChange={changeSettings}
        onPinWidget={onPinWidget}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

function formatTimeHM(t: { hour: number; minute: number }) {
  return `${t.hour}h${String(t.minute).padStart(2, '0')}`;
}

function StatCard({ theme, emoji, value, label, bump, reduceMotion }: { theme: Theme; emoji: string; value: number; label: string; bump?: number; reduceMotion?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!bump || reduceMotion) return;
    scale.setValue(1);
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(scale, { toValue: 1.3, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [bump, reduceMotion, scale]);

  return (
    <View style={[styles.stat, { backgroundColor: theme.card }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Animated.Text style={[styles.statValue, { color: theme.ink, transform: [{ scale }] }]}>{value}</Animated.Text>
      <Text style={[styles.statLabel, { color: theme.muted }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function PalierCard({ theme, streak, next }: { theme: Theme; streak: number; next: number }) {
  const prev = [...PALIERS].reverse().find((p) => p <= streak) ?? 0;
  const ratio = Math.max(0.03, (streak - prev) / (next - prev));
  const remaining = next - streak;
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.palierHead}>
        <Text style={[styles.cardTitle, { color: theme.ink, marginBottom: 0 }]}>Prochain badge : {next} jours</Text>
        <Text style={[styles.palierLeft, { color: theme.coral }]}>encore {remaining}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.future }]}>
        <View style={[styles.fill, { backgroundColor: theme.coral, width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

function Card({ theme, title, children }: { theme: Theme; title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.cardTitle, { color: theme.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  brand: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  date: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  gear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 20 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 4, paddingHorizontal: 12 },
  undo: { fontSize: 14, fontWeight: '600', marginTop: 10, textDecorationLine: 'none' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center' },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 30, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  card: { borderRadius: 24, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  palierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  palierLeft: { fontSize: 14, fontWeight: '800' },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },
});
