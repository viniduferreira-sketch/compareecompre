import { expect, it } from 'vitest';
import { partnerDescription, partnerAttributes } from './product-content';
it('leaves missing partner descriptions empty and preserves supplied text', () => {
  expect(partnerDescription(undefined)).toBe('');
  expect(partnerDescription('   ')).toBe('');
  expect(partnerDescription('  Capacidade de 5 litros.  ')).toBe('Capacidade de 5 litros.');
});
it('decodes named/numeric entities and strips tags without changing decimal measurements', () => {
  expect(partnerDescription('<p>23.6&quot; &ccedil; &atilde; &#233; &amp; &lt;b&gt;MSI&lt;/b&gt;</p>')).toBe('23.6" ç ã é &  MSI');
});
it('preserves every supplied attribute and hides empty fields', () => {
  const attrs = partnerAttributes({ attributes: Array.from({length: 12}, (_,i) => ({ name: `Campo ${i}`, value: String(i) })), model:'MAG242C', colour:'Preto', dimensions:'10 cm', warranty:'12 meses', gtin:'00824142387061', specifications:'VA', empty:'' }, 'awin');
  expect(attrs).toHaveLength(18);
  expect(attrs.find(a => a.name === 'EAN')?.value).toBe('00824142387061');
  expect(partnerAttributes({ model:'', colour:null },'awin')).toEqual([]);
});