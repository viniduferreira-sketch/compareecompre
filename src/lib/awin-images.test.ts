import { expect, it } from 'vitest';
import { normalizeAwinProduct } from './awin-catalog';
import { awinRowPriority } from './awin-rules';
const row = {aw_product_id:'1',merchant_id:'30599',product_name:'Copo Térmico Stanley',merchant_name:'Stanley BR',search_price:'220',aw_deep_link:'https://www.awin1.com/cread.php'};
const columns = ['aw_image_url','merchant_image_url','large_image','alternate_image','aw_thumb_url','merchant_thumb_url'];
for (const column of columns) it(`uses ${column} when earlier columns are blank`,()=>{
 const product=normalizeAwinProduct({...row,[column]:'https://example.com/real.jpg'},'2026-11-13T06:00:00Z');
 expect(product?.imageUrl).toBe('https://example.com/real.jpg');
 expect(product?.images).toEqual(['https://example.com/real.jpg']);
 expect(awinRowPriority({[column]:'https://example.com/real.jpg'})-awinRowPriority({})).toBe(1);
});
it('prefers aw_image_url and keeps merchant alternatives without duplicates',()=>{
 const product=normalizeAwinProduct({...row,aw_image_url:'https://example.com/awin.jpg',merchant_image_url:'https://example.com/shop.jpg',large_image:'https://example.com/shop.jpg'},'2026-11-13T06:00:00Z');
 expect(product?.imageUrl).toBe('https://example.com/awin.jpg');
 expect(product?.images).toEqual(['https://example.com/awin.jpg','https://example.com/shop.jpg']);
});
it('does not fabricate images when columns are blank or invalid',()=>{
 const product=normalizeAwinProduct({...row,aw_image_url:' ',merchant_image_url:'javascript:alert(1)'},'2026-11-13T06:00:00Z');
 expect(product?.imageUrl).toBeNull();expect(product?.images).toEqual([]);
});