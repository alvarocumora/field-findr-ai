import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  BROKER_MIN_SALE_COMMISSION_CLP,
  BROKER_PROJECT_COMMISSIONS,
  brokerCommissionSummary,
  clpAmount,
} from './brokerProgram';

const MIGRATION = resolve(
  __dirname,
  '../../supabase/migrations/20261031120000_project_commission_amounts_update.sql',
);

describe('programa vendedores', () => {
  it('los montos públicos coinciden con la migración de commission_rules', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    const rows = [...sql.matchAll(/\('([0-9a-f-]{36})'::uuid,\s*(\d+)::numeric,\s*(\d+)::numeric/g)].map(
      ([, projectId, sale, capture]) => ({ projectId, sale: Number(sale), capture: Number(capture) }),
    );
    expect(rows).toHaveLength(BROKER_PROJECT_COMMISSIONS.length);
    for (const p of BROKER_PROJECT_COMMISSIONS) {
      expect(rows).toContainEqual({ projectId: p.projectId, sale: p.sale, capture: p.capture });
    }
  });

  it('"desde" usa la comisión por venta más baja', () => {
    expect(BROKER_MIN_SALE_COMMISSION_CLP).toBe(750_000);
  });

  it('formatea montos en pesos chilenos', () => {
    expect(clpAmount(1_200_000)).toBe('$1.200.000');
    expect(brokerCommissionSummary()).toBe(
      'Valle Escondido Licantén: $1.200.000 por venta y $500.000 por captación · ' +
        'Valle de Hualañé: $750.000 por venta y $350.000 por captación',
    );
  });
});
