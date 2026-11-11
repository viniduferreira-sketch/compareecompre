import {describe,it,expect,vi} from 'vitest';
import {readBlogPage} from './blog-pagination';
describe('Public blog pagination',()=>{
 it('returns empty page and actual count for an offset beyond eight articles',async()=>{
  const read=vi.fn().mockResolvedValueOnce({data:null,count:null,error:{code:'PGRST103'}}).mockResolvedValueOnce({data:[{id:'first'}],count:8,error:null});
  expect(await readBlogPage(read,12,23)).toEqual({rows:[],total:8});
  expect(read.mock.calls).toEqual([[12,23],[0,0]]);
 });
 it('handles empty category results without exposing the first row',async()=>{
  const read=vi.fn().mockResolvedValueOnce({data:null,count:null,error:{code:'PGRST103'}}).mockResolvedValueOnce({data:[],count:0,error:null});
  expect(await readBlogPage(read,12,23)).toEqual({rows:[],total:0});
 });
 it('preserves real errors rather than disguising them as empty pages',async()=>{
  const read=vi.fn().mockResolvedValue({data:null,count:null,error:{code:'42501'}});
  await expect(readBlogPage(read,12,23)).rejects.toThrow('Não foi possível carregar os artigos.');
  expect(read).toHaveBeenCalledTimes(1);
 });
 it('returns normal pages without a second query',async()=>{
  const read=vi.fn().mockResolvedValue({data:[{id:'post-13'}],count:13,error:null});
  expect(await readBlogPage(read,12,23)).toEqual({rows:[{id:'post-13'}],total:13});
  expect(read).toHaveBeenCalledTimes(1);
 });
});