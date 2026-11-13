import { expect, it } from 'vitest';
import { storeBuyingCategories } from './store-buying-guides';
import { selectBuyingGuides, showCategoryContent } from './category-content';
const hit=(id:string,categoryName:string,store='Adidas')=>({objectID:id,title:`Produto ${id}`,price:100,imageUrl:'https://example.com/p.jpg',categoryName,store});
it('maps fashion and sports stores to the same editorial category without duplicates',()=>{
 expect(storeBuyingCategories([hit('1','Moda'),hit('2','Esportes'),hit('3','Casa','Outra loja')],['Adidas'])).toEqual(['moda-e-esporte']);
});
it('selects at most two dominant product categories from the unfiltered store catalog',()=>{
 expect(storeBuyingCategories([hit('1','Eletrônicos'),hit('2','Eletrônicos'),hit('3','Casa'),hit('4','Casa'),hit('5','Beleza')],['Adidas'])).toEqual(['casa-e-cozinha','eletronicos','informatica','audio']);
});
it('unknown toy categories have no invented editorial match and retain general published guides only',()=>{
 expect(storeBuyingCategories([hit('1','Brinquedos','Lego')],['Lego'])).toEqual([]);
 const general=[{slug:'como-saber-se-o-desconto-e-real',status:'publicado',publicado_em:'2026-11-01'}];
 expect(selectBuyingGuides([],general,Date.parse('2026-11-13'))).toEqual(general);
});
it('store guides appear on page one only, including a filtered first page',()=>{
 expect(showCategoryContent(1)).toBe(true);expect(showCategoryContent(2)).toBe(false);expect(showCategoryContent(3)).toBe(false);
});