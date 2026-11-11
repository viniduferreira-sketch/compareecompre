import { describe,it,expect } from 'vitest';
import { selectShowcase,showcaseSchema } from './home-showcases';
import type { RelatedHit } from './related-products';
const hit=(id:number,store='A',extra:Partial<RelatedHit>={}):RelatedHit=>({objectID:String(id),title:`Produto ${id}`,store,price:100,imageUrl:`/produto-${id}.webp`,categoryName:'Games',popularity_score:100-id,...extra});
describe('vitrines',()=>{
  it('limita a oito produtos e três da mesma loja com popularidade primeiro',()=>{
    const result=selectShowcase(Array.from({length:20},(_,id)=>hit(id,String(Math.floor(id/4)))),'Games');
    expect(result).toHaveLength(8);expect(result.map(h=>h.objectID)).toEqual(['0','1','2','4','5','6','8','9']);
  });
  it('esconde vitrine com menos de quatro produtos',()=>expect(selectShowcase([hit(1),hit(2),hit(3)],'Games')).toEqual([]));
  it('não mescla chaves iguais entre lojas diferentes',()=>{
    const result=selectShowcase([hit(1,'A',{group_key:'same'}),hit(2,'A',{group_key:'same'}),hit(3,'B',{group_key:'same'}),hit(4,'C'),hit(5,'D')],'Games');
    expect(result.map(h=>h.objectID)).toEqual(['1','3','4','5']);
  });
  it('termos são OU, ignorando caixa e acentos',()=>{
    const items=[hit(1,'A',{title:'Teclado um'}),hit(2,'A',{title:'Mouse dois'}),hit(3,'B',{title:'Headset três'}),hit(4,'B',{title:'Monitor quatro'}),hit(5,'C',{title:'House errado'})];
    expect(selectShowcase(items,'Games',{terms:['TECLADO','mouse','headset','monitor']}).map(h=>h.objectID)).toEqual(['1','2','3','4']);
  });
  it('preço de 20 a 100 inclusivo em todas as categorias',()=>{
    const items=[hit(1,'A',{price:19.99}),hit(2,'A',{price:20}),hit(3,'A',{price:100}),hit(4,'B',{price:60,categoryName:'Casa'}),hit(5,'B',{price:80}),hit(6,'C',{price:100.01})];
    expect(selectShowcase(items,'',{min_price:20,max_price:100}).map(h=>h.objectID)).toEqual(['2','3','4','5']);
  });
  it('esporte exige quatro de Nike e quatro de Adidas e exclui outras lojas',()=>{
    const items=[...Array.from({length:6},(_,i)=>hit(i,'Nike BR')),...Array.from({length:6},(_,i)=>hit(i+10,'adidas BR')),hit(30,'Outro')];
    const opts={stores:['Nike BR','Adidas BR'],store_quota:4};const selected=selectShowcase(items,'',opts);
    expect(selected).toHaveLength(8);expect(selected.filter(h=>h.store==='Nike BR')).toHaveLength(4);expect(selected.filter(h=>h.store==='adidas BR')).toHaveLength(4);
    expect(selectShowcase(items.filter(h=>h.store!=='adidas BR'),' ',opts)).toEqual([]);
  });
  it('elimina mesma imagem e título quase igual incluindo variantes de cor',()=>{
    const items=[hit(1,'A',{title:'Tênis Nike Revolution 7 Preto'}),hit(2,'B',{title:'Tênis Nike Revolution 7 Branco'}),hit(3,'B'),hit(4,'C',{imageUrl:'/produto-3.webp'}),hit(5,'C'),hit(6,'D')];
    expect(selectShowcase(items,'Games').map(h=>h.objectID)).toEqual(['1','3','5','6']);
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