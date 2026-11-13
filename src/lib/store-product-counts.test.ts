import { expect, it } from 'vitest';
import { storeProductCounts } from './store-product-counts';
const hit=(objectID:string,store:string,group_key:string,title='Tênis modelo A')=>({objectID,store,group_key,title,price:100,imageUrl:'https://example.com/p.jpg',source:'awin'});
it('counts one product rather than repeated size rows and never merges stores',()=>{
 const counts=storeProductCounts([hit('1','Adidas','adidas:a'),hit('2','Adidas','adidas:a'),hit('3','Adidas','adidas:b','Camiseta B'),hit('4','Nike','nike:a')]);
 expect(counts.get('Adidas')).toBe(2);expect(counts.get('Nike')).toBe(1);
});