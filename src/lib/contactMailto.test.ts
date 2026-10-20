import { describe, expect, it } from 'vitest';
import { createContactMailto, GENERAL_CONTACT_EMAIL } from './contactMailto';

describe('contact email handoff', () => {
  it('prepares a readable inquiry without pretending it was delivered', () => {
    const uri = createContactMailto({
      name: 'Ana Ejemplo', email: 'ana@example.com',
      phone: '+56 9 1234 5678',
      subject: 'Parcela en Hualañé & visita',
      message: 'Quisiera consultar por un terreno.\nGracias.',
    });
    const u = new URL(uri);
    expect(u.protocol).toBe('mailto:');
    expect(u.pathname).toBe(GENERAL_CONTACT_EMAIL);
    expect(u.searchParams.get('subject')).toContain('Parcela en Hualañé & visita');
    expect(u.searchParams.get('body')).toContain('ana@example.com');
    expect(u.searchParams.get('body')).toContain('Quisiera consultar por un terreno.');
  });
  it('omits the telephone when it is not supplied', () => {
    const uri = new URL(createContactMailto({
      name: 'Ana', email: 'ana@example.com', subject: 'Consulta', message: 'Hola',
    }));
    expect(uri.searchParams.get('body')).not.toContain('Teléfono:');
  });
});
