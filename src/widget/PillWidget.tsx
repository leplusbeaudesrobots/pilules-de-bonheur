import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { dayKey, formatTime } from '../dates';
import { computeStats } from '../streak';
import type { AppState } from '../storage';

export const WIDGET_NAME = 'Pilule';

export interface PillWidgetProps {
  taken: boolean;
  time: string | null;
  streak: number;
}

export function widgetPropsFrom(state: AppState): PillWidgetProps {
  const today = dayKey();
  const stats = computeStats(state.taken, today);
  const iso = state.taken[today];
  return { taken: Boolean(iso), time: iso ? formatTime(iso) : null, streak: stats.streak };
}

export function PillWidget({ taken, time, streak }: PillWidgetProps) {
  if (taken) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#1F3D2E',
          borderRadius: 28,
          padding: 14,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget text={`🔥 ${streak}`} style={{ fontSize: 16, fontWeight: '700', color: '#B8F5CF' }} />
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="C’est pris ✓" style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }} />
          <TextWidget text={`à ${time}`} style={{ fontSize: 14, color: '#B8F5CF' }} />
        </FlexWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="TAKE"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FF6B4A',
        borderRadius: 28,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text={streak > 0 ? `🔥 ${streak} en jeu` : '💊'}
        style={{ fontSize: 16, fontWeight: '700', color: '#FFE3DA' }}
      />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text="J’ai pris" style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }} />
        <TextWidget text="tape ici" style={{ fontSize: 13, color: '#FFE3DA' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
