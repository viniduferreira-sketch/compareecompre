import { describe,it,expect } from 'vitest';
import { storeSlug,resolveStore,storeDescription,storeCatalog,storeCanonical,storeHref } from './store-pages';
import type { RelatedHit } from './related-products';
const identities={'Kabum BR':{name:'Kabum BR',logo_url:null,description:''},'Nike BR':{name:'Nike BR',logo_url:null,description:'Descrição cadastrada'}};
const hit=(i:number,store='Kabum BR'):RelatedHit=>({objectID:String(i),title:`Produto ${i}`,store,price:i+30,imageUrl:'https://example.com/product.jpg',categoryName:i%2?'Games':'Casa',brand:'Corsair',popularity_score:i});
describe('Store pages',()=>{
 it('slugs sem acentos, minúsculos e sem BR',()=>{expect(storeSlug('Móveis São João BR')).toBe('moveis-sao-joao');expect(storeSlug('Mercado Livre')).toBe('mercado-livre');expect(storeSlug('KaBuM BR')).toBe('kabum');});
 it('somente identidades públicas e nunca lojas desativadas/ausentes',()=>{expect(resolveStore(identities,'kabum')?.name).toBe('KaBuM');expect(resolveStore(identities,'inexistente')).toBe(null);expect(resolveStore({},'nike')).toBe(null);});
 it('descrição cadastrada prevalece e fallback é específico',()=>{expect(storeDescription(identities['Nike BR'])).toBe('Descrição cadastrada');expect(storeDescription({name:'Loja Nova',logo_url:null,description:''})).toBe('Compare os preços da Loja Nova com os de outras lojas e vá direto ao site da loja para comprar.');});
 it('24 por página, loja fixa, não inclui concorrentes',()=>{const rows=[...Array.from({length:50},(_,i)=>hit(i)),hit(100,'Nike BR')];const result=storeCatalog(rows,['Kabum BR'],{pagina:2});expect(result.offers).toHaveLength(24);expect(result.paging.total).toBe(50);expect(result.offers.every(o=>o.store==='Kabum BR')).toBe(true);expect(result.availableFilters.some(f=>f.id==='store')).toBe(false);});
 it('categoria, marca e preço filtram a mesma loja',()=>{const result=storeCatalog([hit(0),hit(1),hit(2)],['Kabum BR'],{categoria:'casa',marca:'corsair',min:'31',max:'33'});expect(result.offers.map(o=>o.id)).toEqual(['2']);});
 it('maior preço ordena todo o catálogo antes da paginação',()=>{const result=storeCatalog(Array.from({length:50},(_,i)=>hit(i)),['Kabum BR'],{pagina:2,ordem:'maior-preco'});expect(result.offers[0]?.price).toBe(55);expect(result.offers[23]?.price).toBe(32);});
 it('canonical remove filtros e ordem, mantém página',()=>{expect(storeCanonical('kabum',{categoria:'games',marca:'corsair',ordem:'menor-preco',pagina:2})).toBe('https://compareecompre.com/loja/kabum?pagina=2');expect(storeHref('nike')).toBe('/loja/nike');});
});