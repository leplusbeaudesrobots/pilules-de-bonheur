/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { computeStats } from './streak';
import { addDays } from './dates';

const T = '2026-11-25';
const days = (from: string, n: number, skip: number[] = []) => {
  const r: Record<string, string> = {};
  for (let i = 0; i < n; i++) if (!skip.includes(i)) r[addDays(from, i)] = 'x';
  return r;
};

// vide
let s = computeStats({}, T);
assert.equal(s.streak, 0); assert.equal(s.jokers, 1);

// aujourd'hui seul
s = computeStats({ [T]: 'x' }, T);
assert.equal(s.streak, 1); assert.equal(s.todayTaken, true);

// hier pris, pas encore aujourd'hui : série en jeu
s = computeStats(days(addDays(T, -3), 3), T);
assert.equal(s.streak, 3); assert.equal(s.todayTaken, false);

// un trou consomme le joker de départ
s = computeStats(days(addDays(T, -5), 6, [2]), T);
assert.equal(s.streak, 5); assert.equal(s.jokers, 0);
assert.equal(s.status[addDays(T, -3)], 'joker');

// deux trous sans joker : reset, record conservé
s = computeStats(days(addDays(T, -9), 10, [3, 6]), T);
assert.equal(s.status[addDays(T, -3)], 'missed');
assert.equal(s.streak, 3); assert.equal(s.best, 5);

// 7 jours gagnent un joker (max 2)
s = computeStats(days(addDays(T, -20), 21), T);
assert.equal(s.streak, 21); assert.equal(s.jokers, 2); assert.equal(s.nextPalier, 30);

console.log('streak: ok');
