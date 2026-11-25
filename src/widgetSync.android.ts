import React from 'react';
import { requestWidgetUpdate, requestPinWidget } from 'react-native-android-widget';
import { PillWidget, WIDGET_NAME, widgetPropsFrom } from './widget/PillWidget';
import type { AppState } from './storage';

export async function refreshWidget(state: AppState): Promise<void> {
  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: (info) =>
        React.createElement(PillWidget, widgetPropsFrom(state, { width: info.width, height: info.height })),
    });
  } catch {
    // pas de widget posé : rien à faire
  }
}

export async function pinWidget(): Promise<boolean> {
  try {
    return await requestPinWidget({ widgetName: WIDGET_NAME });
  } catch {
    return false;
  }
}
