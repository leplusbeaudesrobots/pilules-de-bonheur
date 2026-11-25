function pick<T>(list: T[], seed?: number): T {
  const i = seed === undefined ? Math.floor(Math.random() * list.length) : seed % list.length;
  return list[i];
}

export const RAPPEL_MATIN = [
  { title: 'Ta pilule t’attend 💊', body: 'Un tap et c’est réglé.' },
  { title: 'Hop, la pilule 💊', body: 'Prends-la et coche, ta série compte sur toi.' },
  { title: 'Petit rendez-vous 💊', body: 'La pilule du jour, c’est maintenant.' },
  { title: 'Allez, on y va 💊', body: 'Pilule, verre d’eau, tap. Trois secondes.' },
];

export const RAPPEL_MIDI = [
  { title: 'Eh, t’as oublié ta pilule 👀', body: 'File la prendre !' },
  { title: 'Psst, la pilule 👀', body: 'Elle est toujours là. File la prendre !' },
  { title: 'Midi, et toujours rien 👀', body: 'T’as oublié ta pilule, file la prendre !' },
];

export function rappelMatin(seed: number) {
  return pick(RAPPEL_MATIN, seed);
}
export function rappelMidi(seed: number) {
  return pick(RAPPEL_MIDI, seed);
}

/** Message affiché juste après avoir coché. */
export function bravo(streak: number): string {
  if (streak === 1) return pick(['Premier jour. Ça commence ici.', 'C’est parti. Jour 1.']);
  return pick([
    `Bien joué. ${streak} jours.`,
    `Et de ${streak} !`,
    `Propre. ${streak} jours d’affilée.`,
    `Coché. Série : ${streak}.`,
    `Tranquille. ${streak} jours.`,
  ]);
}

export function bravoPalier(streak: number): string {
  return pick([
    `${streak} jours ! Là tu régales.`,
    `Palier ${streak} débloqué. Respect.`,
    `${streak} jours d’affilée. Rien que ça.`,
  ]);
}

/** Sous-titre quand ce n'est pas encore pris. */
export function enAttente(streak: number, hour: number): string {
  if (streak === 0) return 'Un tap pour lancer ta série.';
  if (hour >= 12) return `Ta série de ${streak} jours t’attend. File !`;
  return `Ta série de ${streak} jours est en jeu.`;
}
