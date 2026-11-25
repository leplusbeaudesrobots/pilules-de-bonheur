import { dayKey } from './dates';
import { clearDelivered, rescheduleAll } from './notifications';
import { loadState, saveState, type AppState } from './storage';
import { refreshWidget } from './widgetSync';

/** Propage un nouvel état partout : stockage, notifs, widget. */
export async function commit(state: AppState): Promise<AppState> {
  await saveState(state);
  await Promise.allSettled([rescheduleAll(state), refreshWidget(state)]);
  return state;
}

/** Coche aujourd'hui. Utilisable depuis l'app, le widget ou la notif (headless). */
export async function markTakenToday(): Promise<AppState> {
  const state = await loadState();
  const today = dayKey();
  if (!state.taken[today]) {
    state.taken = { ...state.taken, [today]: new Date().toISOString() };
  }
  await clearDelivered().catch(() => {});
  return commit(state);
}
