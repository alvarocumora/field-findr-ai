import { describe, it, expect } from 'vitest';
import { validatePublicLead } from './leadForm';

const base = { firstName: 'Ana', email: 'ana@example.cl', phone: '', message: '' };

describe('validatePublicLead', () => {
  it('accepts a name + email', () => {
    expect(validatePublicLead(base)).toBeNull();
  });
  it('accepts a name + phone only', () => {
    expect(validatePublicLead({ ...base, email: '', phone: '+56911112222' })).toBeNull();
  });
  it('requires a name', () => {
    expect(validatePublicLead({ ...base, firstName: '  ' })).toBe('Ingresa tu nombre');
  });
  it('requires at least one contact channel', () => {
    expect(validatePublicLead({ ...base, email: '', phone: '' })).toMatch(/email o teléfono/);
  });
  it('rejects an invalid email', () => {
    expect(validatePublicLead({ ...base, email: 'no-arroba' })).toBe('El email no es válido');
  });
});
