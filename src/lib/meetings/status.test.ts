import { describe, it, expect } from 'vitest';

import {
  MEETING_STATUS_LABELS,
  MEETING_TRANSITIONS,
  canTransition,
  type MeetingStatus,
} from './status';

describe('meetings/status', () => {
  it('toda transición apunta a un estado conocido', () => {
    const known = Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[];
    for (const [from, targets] of Object.entries(MEETING_TRANSITIONS)) {
      expect(known).toContain(from);
      for (const to of targets) expect(known).toContain(to);
    }
  });

  it('los estados terminales no tienen salidas', () => {
    expect(MEETING_TRANSITIONS.completed).toEqual([]);
    expect(MEETING_TRANSITIONS.cancelled).toEqual([]);
    expect(MEETING_TRANSITIONS.no_show).toEqual([]);
  });

  it('el flujo feliz pending → confirmed → completed es válido', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'completed')).toBe(true);
  });

  it('no se puede completar una reunión sin confirmar', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
  });
});
