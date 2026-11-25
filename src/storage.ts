import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  morning: { hour: number; minute: number };
  noon: { hour: number; minute: number };
}

export interface AppState {
  /** dayKey -> ISO de l'heure de prise */
  taken: Record<string, string>;
  settings: Settings;
}

const KEY = 'pilules-de-bonheur/state/v1';

export const DEFAULT_SETTINGS: Settings = {
  morning: { hour: 9, minute: 30 },
  noon: { hour: 12, minute: 0 },
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        taken: parsed.taken ?? {},
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
  } catch {
    // stockage illisible : on repart proprement
  }
  return { taken: {}, settings: DEFAULT_SETTINGS };
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
