import {describe,it,expect} from 'vitest';
import {PRODUCT_CATEGORIES,categorySlug,categoryBySlug,categoryHead,categoryHref,categorySort} from './category-pages';
describe('Category URL rules',()=>{
 it('generates lowercase accent-free slugs',()=>{expect(categorySlug('Eletrônicos')).toBe('eletronicos');expect(categorySlug('Casa')).toBe('casa');});
 it('only accepts the seven existing categories',()=>{expect(PRODUCT_CATEGORIES).toHaveLength(7);expect(categoryBySlug('inexistente')).toBeUndefined();expect(categoryBySlug('casa')?.name).toBe('Casa');});
 it('keeps filters and pagination in shareable URLs',()=>{expect(categoryHref('casa',{marca:'mondial',loja:'kabum',ordem:'menor-preco',pagina:2})).toBe('/categoria/casa?marca=mondial&loja=kabum&ordem=menor-preco&pagina=2');});
 it('canonical ignores filters but keeps page two',()=>{expect(categoryHead('Casa','casa',2).links).toEqual([{rel:'canonical',href:'https://compareecompre.com/categoria/casa?pagina=2'}]);expect(categoryHead('Casa','casa').links[0]?.href).toBe('https://compareecompre.com/categoria/casa');});
 it('keeps category titles within sixty characters',()=>{for(const c of PRODUCT_CATEGORIES)expect(categoryHead(c.name,c.slug).meta[0]?.title?.length).toBeLessThanOrEqual(60);});
 it('preserves price ordering',()=>{expect(categorySort('menor-preco')).toBe('price_asc');expect(categorySort('maior-preco')).toBe('price_desc');});
 it('marks page two and beyond as noindex follow, page one stays indexable',()=>{const robots=(page?:number)=>categoryHead('Casa','casa',page).meta.find(m=>'name' in m&&m.name==='robots');expect(robots(2)).toEqual({name:'robots',content:'noindex, follow'});expect(robots(3)).toEqual({name:'robots',content:'noindex, follow'});expect(robots(1)).toBeUndefined();expect(robots()).toBeUndefined();});
});