import React from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatHM } from '../dates';
import type { Settings } from '../storage';
import type { Theme } from '../theme';

interface Props {
  visible: boolean;
  settings: Settings;
  notifGranted: boolean;
  theme: Theme;
  onChange: (s: Settings) => void;
  onPinWidget: () => void;
  onClose: () => void;
}

type HM = { hour: number; minute: number };

function shift(t: HM, delta: number): HM {
  const total = Math.min(23 * 60 + 45, Math.max(0, t.hour * 60 + t.minute + delta));
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

export function SettingsSheet({ visible, settings, notifGranted, theme, onChange, onPinWidget, onClose }: Props) {
  const toMin = (t: HM) => t.hour * 60 + t.minute;

  const setMorning = (d: number) => {
    const morning = shift(settings.morning, d);
    // la relance reste toujours après le rappel du matin
    const noon = toMin(settings.noon) <= toMin(morning) ? shift(morning, 30) : settings.noon;
    onChange({ morning, noon });
  };
  const setNoon = (d: number) => {
    const noon = shift(settings.noon, d);
    if (toMin(noon) <= toMin(settings.morning)) return;
    onChange({ ...settings, noon });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <View style={[styles.grabber, { backgroundColor: theme.line }]} />
        <Text style={[styles.title, { color: theme.ink }]}>Réglages</Text>

        <Stepper label="Rappel du matin" value={formatHM(settings.morning.hour, settings.morning.minute)} theme={theme} onMinus={() => setMorning(-15)} onPlus={() => setMorning(15)} />
        <Stepper label="Relance si oubli" value={formatHM(settings.noon.hour, settings.noon.minute)} theme={theme} onMinus={() => setNoon(-15)} onPlus={() => setNoon(15)} />

        {!notifGranted && (
          <Pressable onPress={() => Linking.openSettings()} style={[styles.warn, { backgroundColor: theme.coralSoft }]}>
            <Text style={[styles.warnText, { color: theme.ink }]}>⚠️ Notifications désactivées : aucun rappel ne sonnera. Tape pour les activer.</Text>
          </Pressable>
        )}

        {Platform.OS === 'android' && (
          <Pressable onPress={onPinWidget} style={({ pressed }) => [styles.btn, { backgroundColor: theme.ink, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[styles.btnText, { color: theme.bg }]}>Ajouter le widget à l’écran d’accueil</Text>
          </Pressable>
        )}

        <Text style={[styles.foot, { color: theme.muted }]}>
          1 joker offert au départ, +1 tous les 7 jours pris (2 max). Un oubli consomme un joker au lieu de casser ta série.
        </Text>
      </View>
    </Modal>
  );
}

function Stepper({ label, value, theme, onMinus, onPlus }: { label: string; value: string; theme: Theme; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={[styles.stepper, { borderColor: theme.line }]}>
      <Text style={[styles.stepLabel, { color: theme.ink }]}>{label}</Text>
      <View style={styles.stepCtrl}>
        <RoundBtn text="−" theme={theme} onPress={onMinus} label={`${label} moins 15 minutes`} />
        <Text style={[styles.stepValue, { color: theme.ink }]}>{value}</Text>
        <RoundBtn text="+" theme={theme} onPress={onPlus} label={`${label} plus 15 minutes`} />
      </View>
    </View>
  );
}

function RoundBtn({ text, theme, onPress, label }: { text: string; theme: Theme; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.round, { backgroundColor: theme.bg, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
    >
      <Text style={[styles.roundText, { color: theme.ink }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  stepLabel: { fontSize: 16, fontWeight: '600' },
  stepCtrl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepValue: { fontSize: 18, fontWeight: '800', minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roundText: { fontSize: 22, fontWeight: '700' },
  warn: { marginTop: 16, padding: 14, borderRadius: 16 },
  warnText: { fontSize: 14, fontWeight: '600' },
  btn: { marginTop: 20, paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  foot: { fontSize: 13, marginTop: 16, lineHeight: 18 },
});
