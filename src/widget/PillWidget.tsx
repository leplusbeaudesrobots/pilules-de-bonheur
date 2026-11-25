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
  /** Taille réelle du widget en dp (fournie par le launcher). */
  width?: number;
  height?: number;
}

export function widgetPropsFrom(state: AppState, size?: { width: number; height: number }): PillWidgetProps {
  const today = dayKey();
  const stats = computeStats(state.taken, today);
  const iso = state.taken[today];
  return {
    taken: Boolean(iso),
    time: iso ? formatTime(iso) : null,
    streak: stats.streak,
    width: size?.width,
    height: size?.height,
  };
}

type Layout = 'mini' | 'row' | 'column' | 'regular';

/**
 * mini    : 1x1, juste l'essentiel
 * row     : 2x1, 3x1, 4x1… (bandeau horizontal)
 * column  : 1x2 (étroit et haut)
 * regular : 2x2 et plus
 */
export function layoutFor(width = 160, height = 160): Layout {
  const narrow = width < 110;
  const short = height < 100;
  if (narrow && short) return 'mini';
  if (short) return 'row';
  if (narrow) return 'column';
  return 'regular';
}

const C = {
  todo: { bg: '#FF6B4A', soft: '#FFE3DA' },
  done: { bg: '#1F3D2E', soft: '#B8F5CF' },
} as const;

export function PillWidget({ taken, time, streak, width, height }: PillWidgetProps) {
  const layout = layoutFor(width, height);
  const c = taken ? C.done : C.todo;
  const radius = layout === 'regular' ? 28 : 22;

  const title = taken ? 'C’est pris ✓' : 'J’ai pris';
  const sub = taken ? `à ${time}` : 'tape ici';
  const streakText = taken ? `🔥 ${streak}` : streak > 0 ? `🔥 ${streak} en jeu` : '💊';

  const box = {
    height: 'match_parent' as const,
    width: 'match_parent' as const,
    backgroundColor: c.bg,
    borderRadius: radius,
  };
  const click = taken ? { clickAction: 'OPEN_APP' } : { clickAction: 'TAKE' };

  if (layout === 'mini') {
    return (
      <FlexWidget {...click} style={{ ...box, padding: 6, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <TextWidget text={taken ? '✓' : '💊'} style={{ fontSize: taken ? 30 : 26, fontWeight: '800', color: '#FFFFFF' }} />
        {streak > 0 && <TextWidget text={`🔥${streak}`} style={{ fontSize: 12, fontWeight: '700', color: c.soft }} />}
      </FlexWidget>
    );
  }

  if (layout === 'row') {
    const compact = (height ?? 80) < 64;
    return (
      <FlexWidget
        {...click}
        style={{ ...box, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text={taken ? '✓' : '💊'} style={{ fontSize: compact ? 20 : 24, fontWeight: '800', color: '#FFFFFF', marginRight: 10 }} />
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget text={taken ? (compact ? `Pris à ${time}` : 'Pris') : 'J’ai pris'} style={{ fontSize: compact ? 15 : 18, fontWeight: '800', color: '#FFFFFF' }} maxLines={1} />
            {!compact && <TextWidget text={sub} style={{ fontSize: 12, color: c.soft }} maxLines={1} />}
          </FlexWidget>
        </FlexWidget>
        {streak > 0 && (
          <TextWidget text={`🔥${streak}`} style={{ fontSize: compact ? 13 : 15, fontWeight: '700', color: c.soft, marginLeft: 8 }} maxLines={1} />
        )}
      </FlexWidget>
    );
  }

  if (layout === 'column') {
    return (
      <FlexWidget {...click} style={{ ...box, padding: 10, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextWidget text={streak > 0 ? `🔥 ${streak}` : ' '} style={{ fontSize: 13, fontWeight: '700', color: c.soft }} />
        <TextWidget text={taken ? '✓' : '💊'} style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF' }} />
        <TextWidget text={taken ? (time ?? 'Pris') : 'J’ai pris'} style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }} maxLines={1} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget {...click} style={{ ...box, padding: 14, flexDirection: 'column', justifyContent: 'space-between' }}>
      <TextWidget text={streakText} style={{ fontSize: 16, fontWeight: '700', color: c.soft }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={title} style={{ fontSize: taken ? 20 : 22, fontWeight: '800', color: '#FFFFFF' }} />
        <TextWidget text={sub} style={{ fontSize: taken ? 14 : 13, color: c.soft }} />
      </FlexWidget>
    </FlexWidget>
  );
}
