import { describe, it, expect } from 'vitest';
import { notificationToActivity } from './notificationToActivity';

const base = { id: 'n1', title: 'T', message: 'M', created_at: '2026-07-11T12:00:00Z' };

describe('notificationToActivity', () => {
  it('maps reservation and payment as success', () => {
    expect(notificationToActivity({ ...base, type: 'reservation' })).toMatchObject({ type: 'sale', status: 'success' });
    expect(notificationToActivity({ ...base, type: 'payment' })).toMatchObject({ type: 'payment', status: 'success' });
  });
  it('maps lead as info', () => {
    expect(notificationToActivity({ ...base, type: 'lead' })).toMatchObject({ type: 'lead', status: 'info' });
  });
  it('maps listing/property/approval to document', () => {
    for (const t of ['listing', 'property', 'approval']) {
      expect(notificationToActivity({ ...base, type: t }).type).toBe('document');
    }
  });
  it('falls back to alert for unknown types', () => {
    expect(notificationToActivity({ ...base, type: 'weird' }).type).toBe('alert');
  });
  it('carries title, message and a parsed timestamp', () => {
    const a = notificationToActivity({ ...base, type: 'lead' });
    expect(a.title).toBe('T');
    expect(a.description).toBe('M');
    expect(a.timestamp instanceof Date).toBe(true);
    expect(a.timestamp.getTime()).toBe(Date.parse('2026-07-11T12:00:00Z'));
  });
  it('handles a null message', () => {
    expect(notificationToActivity({ ...base, type: 'lead', message: null }).description).toBeUndefined();
  });
});
