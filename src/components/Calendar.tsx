import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, parseKey } from '../dates';
import type { DayStatus } from '../streak';
import type { Theme } from '../theme';

const WEEKS = 5;
const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  today: string;
  status: Record<string, DayStatus>;
  theme: Theme;
  onToggle: (key: string) => void;
}

export function Calendar({ today, status, theme, onToggle }: Props) {
  const dow = (parseKey(today).getDay() + 6) % 7; // lundi = 0
  const start = addDays(today, -dow - (WEEKS - 1) * 7);

  const rows = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );

  return (
    <View>
      <View style={styles.row}>
        {LETTRES.map((l, i) => (
          <Text key={i} style={[styles.letter, { color: theme.muted }]}>
            {l}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((key) => {
            const future = key > today;
            const s = status[key];
            const isToday = key === today;
            const bg = future
              ? theme.future
              : s === 'taken'
                ? theme.green
                : s === 'joker'
                  ? theme.joker
                  : s === 'missed'
                    ? theme.missed
                    : theme.future;
            const filled = s === 'taken' || s === 'joker';
            return (
              <Pressable
                key={key}
                disabled={future}
                onPress={() => onToggle(key)}
                hitSlop={2}
                accessibilityLabel={`${parseKey(key).getDate()}, ${s === 'taken' ? 'pris' : s === 'joker' ? 'joker' : 'pas pris'}`}
                style={({ pressed }) => [
                  styles.cell,
                  { backgroundColor: bg, transform: [{ scale: pressed ? 0.88 : 1 }] },
                  isToday && { borderWidth: 2.5, borderColor: theme.coral },
                ]}
              >
                <Text style={[styles.num, { color: filled ? '#FFFFFF' : future ? theme.muted : theme.ink, opacity: future ? 0.5 : 1 }]}>
                  {s === 'joker' ? '🃏' : parseKey(key).getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={[styles.legend]}>
        <Dot color={theme.green} label="Pris" theme={theme} />
        <Dot color={theme.joker} label="Joker" theme={theme} />
        <Dot color={theme.missed} label="Manqué" theme={theme} />
      </View>
      <Text style={[styles.hint, { color: theme.muted }]}>Oublié de cocher ? Tape sur le jour.</Text>
    </View>
  );
}

function Dot({ color, label, theme }: { color: string; label: string; theme: Theme }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  letter: { width: 38, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  cell: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 6 },
});
