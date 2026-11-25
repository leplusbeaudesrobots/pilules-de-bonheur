// Version par défaut (web / iOS) : pas de widget.
import type { AppState } from './storage';

export async function refreshWidget(_state: AppState): Promise<void> {}
export async function pinWidget(): Promise<boolean> {
  return false;
}
