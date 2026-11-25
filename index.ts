import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import App from './App';
import { markTakenToday } from './src/actions';
import { ACTION_TAKE } from './src/notifications';

// Bouton « C'est pris ✓ » de la notification, app fermée ou en arrière-plan (Android).
const NOTIF_TASK = 'pilule-notification-action';
TaskManager.defineTask<Notifications.NotificationTaskPayload>(NOTIF_TASK, async ({ data }) => {
  if (data && 'actionIdentifier' in data && data.actionIdentifier === ACTION_TAKE) {
    await markTakenToday();
  }
});

if (Platform.OS === 'android') {
  Notifications.registerTaskAsync(NOTIF_TASK).catch(() => {});
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { widgetTaskHandler } = require('./src/widget/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

registerRootComponent(App);
