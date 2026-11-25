import { addDays } from './dates';

export const JOKERS_AU_DEPART = 1;
export const JOKERS_MAX = 2;
/** Jours pris d'affilée pour gagner un joker. */
export const JOURS_POUR_JOKER = 7;

export const PALIERS = [3, 7, 14, 30, 50, 100, 150, 200, 365, 500, 730, 1000];

export type DayStatus = 'taken' | 'joker' | 'missed';

export interface Stats {
  streak: number;
  best: number;
  jokers: number;
  total: number;
  todayTaken: boolean;
  /** Progression vers le prochain joker (0..JOURS_POUR_JOKER-1). */
  jokerProgress: number;
  status: Record<string, DayStatus>;
  nextPalier: number | null;
}

/**
 * Rejoue tout l'historique depuis le premier jour pris.
 * Un jour manqué consomme un joker s'il en reste (la série continue sans augmenter),
 * sinon la série repart à zéro. Le record ne se perd jamais.
 */
export function computeStats(taken: Record<string, string>, today: string): Stats {
  const keys = Object.keys(taken).sort();
  const status: Record<string, DayStatus> = {};
  let streak = 0;
  let best = 0;
  let jokers = JOKERS_AU_DEPART;
  let progress = 0;

  const todayTaken = Boolean(taken[today]);

  if (keys.length > 0 && keys[0] <= today) {
    for (let d = keys[0]; d < today; d = addDays(d, 1)) {
      if (taken[d]) {
        streak++;
        progress++;
        status[d] = 'taken';
        if (progress >= JOURS_POUR_JOKER) {
          progress = 0;
          jokers = Math.min(JOKERS_MAX, jokers + 1);
        }
      } else if (jokers > 0 && streak > 0) {
        jokers--;
        status[d] = 'joker';
      } else {
        streak = 0;
        progress = 0;
        status[d] = 'missed';
      }
      best = Math.max(best, streak);
    }
  }

  if (todayTaken) {
    streak++;
    progress++;
    status[today] = 'taken';
    if (progress >= JOURS_POUR_JOKER) {
      progress = 0;
      jokers = Math.min(JOKERS_MAX, jokers + 1);
    }
    best = Math.max(best, streak);
  }

  return {
    streak,
    best,
    jokers,
    total: keys.filter((k) => k <= today).length,
    todayTaken,
    jokerProgress: progress,
    status,
    nextPalier: PALIERS.find((p) => p > streak) ?? null,
  };
}

/** Vrai si la série vient d'atteindre pile un palier. */
export function isPalier(streak: number): boolean {
  return PALIERS.includes(streak);
}
