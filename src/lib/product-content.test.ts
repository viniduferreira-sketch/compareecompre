import { expect, it } from 'vitest';
import { partnerDescription } from './product-content';
it('leaves missing partner descriptions empty and preserves supplied text', () => {
  expect(partnerDescription(undefined)).toBe('');
  expect(partnerDescription('   ')).toBe('');
  expect(partnerDescription('  Capacidade de 5 litros.  ')).toBe('Capacidade de 5 litros.');
});