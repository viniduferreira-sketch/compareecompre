import {describe,it,expect} from 'vitest';
import {BLOG_PAGE_SIZE} from './blog-public';
import {blogPageHref,prepareBlogReading} from './blog-portal';
describe('Blog portal rules',()=>{
 it('paginates with twelve articles',()=>{expect(BLOG_PAGE_SIZE).toBe(12);});
 it('preserves category and article search in numbered page links',()=>{expect(blogPageHref('/blog/categoria/celulares',2,'celular')).toBe('/blog/categoria/celulares?pagina=2&q=celular');});
 it('generates distinct section anchors without editing heading text',()=>{const result=prepareBlogReading('<h2>Escolha <strong>bem</strong></h2><p>Texto</p><h2>Escolha bem</h2>');expect(result.headings).toEqual([{id:'secao-1',title:'Escolha bem'},{id:'secao-2',title:'Escolha bem'}]);expect(result.body).toContain('<h2 id="secao-1">Escolha <strong>bem</strong></h2>');});
});