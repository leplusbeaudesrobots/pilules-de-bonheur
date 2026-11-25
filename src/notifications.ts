import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, dayKey, parseKey } from './dates';
import { rappelMatin, rappelMidi } from './messages';
import type { AppState } from './storage';

export const CHANNEL_ID = 'rappels';
export const CATEGORY_ID = 'pilule';
export const ACTION_TAKE = 'TAKE';
/** Nombre de jours programmés à l'avance (re-programmé à chaque ouverture / prise). */
const HORIZON_JOURS = 21;

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels pilule',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#FF6B4A',
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_TAKE,
      buttonTitle: 'C’est pris ✓',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Efface tout et reprogramme : rappel du matin + relance de midi
 * pour chaque jour à venir non encore coché.
 */
export async function rescheduleAll(state: AppState): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const today = dayKey();
  const { morning, noon } = state.settings;

  for (let i = 0; i < HORIZON_JOURS; i++) {
    const key = addDays(today, i);
    if (state.taken[key]) continue;
    const base = parseKey(key);
    const seed = base.getDate();

    const m = new Date(base);
    m.setHours(morning.hour, morning.minute, 0, 0);
    if (m.getTime() > now) {
      const msg = rappelMatin(seed);
      await schedule(`matin-${key}`, msg.title, msg.body, m, key);
    }

    const n = new Date(base);
    n.setHours(noon.hour, noon.minute, 0, 0);
    if (n.getTime() > now) {
      const msg = rappelMidi(seed);
      await schedule(`midi-${key}`, msg.title, msg.body, n, key);
    }
  }
}

async function schedule(id: string, title: string, body: string, date: Date, key: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      categoryIdentifier: CATEGORY_ID,
      data: { day: key },
      color: '#FF6B4A',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

export async function clearDelivered(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
