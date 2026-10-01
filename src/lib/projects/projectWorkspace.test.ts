import { describe, expect, it } from 'vitest';
import {
  buildProjectWorkspaceReadiness,
  buildProjectWorkspaceStats,
  projectWorkspacePath,
  resolveProjectWorkspaceTab,
} from './projectWorkspace';

describe('projectWorkspace model', () => {
  it('normalizes tabs and generates canonical workspace URLs', () => {
    expect(resolveProjectWorkspaceTab('ventas')).toBe('ventas');
    expect(resolveProjectWorkspaceTab('legacy')).toBe('resumen');
    expect(projectWorkspacePath('p1')).toBe('/asesor/project/p1');
    expect(projectWorkspacePath('p1', 'reservas')).toBe('/asesor/project/p1?tab=reservas');
  });

  it('calculates shared inventory and reservation metrics once', () => {
    const stats = buildProjectWorkspaceStats(
      [
        { status: 'available', price: 10 },
        { status: 'reserved', price: 20 },
        { status: 'sold', price: 30 },
      ],
      [
        { status: 'pending_payment', reservation_amount: 1 },
        { status: 'paid', reservation_amount: 2 },
        { status: 'converted', reservation_amount: 3 },
      ],
    );

    expect(stats).toMatchObject({
      total: 3,
      available: 1,
      reserved: 1,
      sold: 1,
      soldPct: 33,
      inventoryValue: 10,
      soldValue: 30,
      pendingReservations: 1,
      paidReservations: 1,
      deposited: 5,
    });
  });

  it('uses one readiness definition for the whole workspace', () => {
    const readiness = buildProjectWorkspaceReadiness(
      {
        region: 'Maule',
        country: 'Chile',
        kmz_file_url: null,
        images: ['cover.jpg'],
        status: 'active',
      },
      [{ status: 'available', price: 100 }],
      true,
    );

    expect(readiness.score).toBe(100);
    expect(readiness.checks.every((check) => check.ready)).toBe(true);
  });

  it('adds Sentinel-2 to readiness only after satellite status is resolved', () => {
    const project = {
      region: 'Maule',
      country: 'Chile',
      kmz_file_url: 'project.kmz',
      images: ['cover.jpg'],
      status: 'active',
    };
    const lots = [{ status: 'available', price: 100 }];

    const pending = buildProjectWorkspaceReadiness(project, lots, true, null);
    const available = buildProjectWorkspaceReadiness(project, lots, true, true);
    const unavailable = buildProjectWorkspaceReadiness(project, lots, true, false);

    expect(pending.checks.some((check) => check.label.includes('Sentinel'))).toBe(false);
    expect(pending.score).toBe(100);
    expect(available.checks.find((check) => check.label.includes('Sentinel'))?.ready).toBe(true);
    expect(available.score).toBe(100);
    expect(unavailable.checks.find((check) => check.label.includes('Sentinel'))?.ready).toBe(false);
    expect(unavailable.score).toBe(86);
  });
});
