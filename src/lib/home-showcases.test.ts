import { describe,it,expect } from 'vitest';
import { selectShowcase,showcaseSchema } from './home-showcases';
import type { RelatedHit } from './related-products';
const hit=(id:number,store='A',extra:Partial<RelatedHit>={}):RelatedHit=>({objectID:String(id),title:`Produto ${id}`,store,price:100,imageUrl:'/produto.webp',categoryName:'Games',popularity_score:100-id,...extra});
describe('vitrines',()=>{
  it('limita a oito produtos e três da mesma loja com popularidade primeiro',()=>{
    const result=selectShowcase(Array.from({length:20},(_,id)=>hit(id,String(Math.floor(id/4)))),'Games');
    expect(result).toHaveLength(8);expect(result.map(h=>h.objectID)).toEqual(['0','1','2','4','5','6','8','9']);
  });
  it('esconde vitrine com menos de quatro produtos',()=>expect(selectShowcase([hit(1),hit(2),hit(3)],'Games')).toEqual([]));
  it('agrupa dentro da loja mas preserva outras lojas',()=>{
    const result=selectShowcase([hit(1,'A',{group_key:'same'}),hit(2,'A',{group_key:'same'}),hit(3,'B',{group_key:'same'}),hit(4,'C'),hit(5,'D')],'Games');
    expect(result.map(h=>h.objectID)).toEqual(['1','3','4','5']);
  });
  it('rejeita produtos ocultos, pendentes, sem imagem ou preço e categoria diferente',()=>{
    const invalid=[hit(10,'E',{status:'unavailable'}),hit(11,'E',{quality_status:'rejected'}),hit(12,'E',{site_hidden:true}),hit(13,'E',{price_review_status:'pending'}),hit(14,'E',{price:0}),hit(15,'E',{imageUrl:null}),hit(16,'E',{categoryName:'Casa'})];
    expect(selectShowcase([...invalid,hit(1),hit(2),hit(3),hit(4,'B')],'Games').map(h=>h.objectID)).toEqual(['1','2','3','4']);
  });
  it('permite categoria conhecida e termos opcionais, rejeita categoria inexistente',()=>{
    const data={title:'Vitrine',subtitle:'',category_slug:'games',terms:[],sort_order:1,active:true};
    expect(showcaseSchema.safeParse(data).success).toBe(true);expect(showcaseSchema.safeParse({...data,category_slug:'inexistente'}).success).toBe(false);
  });
});