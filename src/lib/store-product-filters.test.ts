import { expect, it } from 'vitest';
import { classifyStoreProduct } from './store-product-filters';
import { normalizeAwinProduct } from './awin-catalog';
it.each([['Copo Térmico de Cerveja Stanley','Copo Térmico'],['Garrafa Térmica Classic Stanley','Garrafa Térmica'],['Growler Térmico Classic','Growler'],['Caneca Térmica Stanley','Caneca Térmica'],['Cuia Térmica Matte','Cuia Térmica']])('derives %s from its explicit title prefix',(title,expected)=>{
 expect(classifyStoreProduct({title}).productType).toBe(expected);
});
it('prefers the specific partner category over title words',()=>{
 expect(classifyStoreProduct({merchant_category:'Moda > Acessórios > Meias',title:'Meias para tênis',category_name:'Mens'})).toEqual({productType:'Acessórios',audience:['Masculino']});
});
it('uses explicit title words only where taxonomy is absent',()=>{
 expect(classifyStoreProduct({title:'Tênis infantil feminino'})).toEqual({productType:'Tênis',audience:['Feminino','Infantil']});
 expect(classifyStoreProduct({title:'Jaqueta Unissex'})).toEqual({productType:'Jaquetas',audience:['Unissex']});
});
it('does not invent a type or audience for unknown or ambiguous titles',()=>{
 expect(classifyStoreProduct({title:'Produto azul 123'})).toEqual({productType:null,audience:[]});
 expect(classifyStoreProduct({title:'Kit camiseta e calça'}).productType).toBeNull();
});
it('does not classify accessories or computers as the device mentioned in their title',()=>{
 expect(classifyStoreProduct({title:'Suporte para TV PIX'}).productType).toBe('Acessórios');
 expect(classifyStoreProduct({title:'Cabo de energia para notebook'}).productType).toBe('Acessórios');
 expect(classifyStoreProduct({title:'iMac Apple SSD 256GB'}).productType).toBe('Computadores');
});
it('persists supplied Awin taxonomy and derived facets in the same record',()=>{
 const p=normalizeAwinProduct({aw_product_id:'1',merchant_id:'2',product_name:'Produto azul',merchant_name:'Adidas',search_price:'99',aw_deep_link:'https://www.awin1.com/cread.php',merchant_category:'Roupas > Camisetas',product_type:'T-shirts',category_name:'Women',category_path:'Fashion > Clothing'},'2026-11-13T05:36:00Z');
 expect(p?.merchant_category).toBe('Roupas > Camisetas');expect(p?.category_path).toBe('Fashion > Clothing');expect(p?.productType).toBe('Camisetas');expect(p?.audience).toEqual(['Feminino']);
});