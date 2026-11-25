import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { markTakenToday } from '../actions';
import { loadState } from '../storage';
import { PillWidget, widgetPropsFrom } from './PillWidget';

export async function widgetTaskHandler({ widgetInfo, widgetAction, clickAction, renderWidget }: WidgetTaskHandlerProps) {
  const size = { width: widgetInfo.width, height: widgetInfo.height };
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const state = await loadState();
      renderWidget(<PillWidget {...widgetPropsFrom(state, size)} />);
      break;
    }
    case 'WIDGET_CLICK': {
      if (clickAction === 'TAKE') {
        const state = await markTakenToday();
        renderWidget(<PillWidget {...widgetPropsFrom(state, size)} />);
      }
      break;
    }
    default:
      break;
  }
}
