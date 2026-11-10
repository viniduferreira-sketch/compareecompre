import { describe, it, expect, vi, afterEach } from 'vitest';
import { gzipSync } from 'node:zlib';
import { openFeed, parseCsv, maskFeedUrl, validateFeedUrl, FEED_TEST_MAX_BYTES, FEED_TEST_MAX_ROWS, FEED_TEST_TIMEOUT_MS } from '../../scripts/awin-feed-reader.mjs';
import { processFeedSequence } from '../../scripts/awin-feed-sequence.mjs';
const state=vi.hoisted(()=>({feeds:[],error:null}));
vi.mock('@/integrations/supabase/client.server',()=>({supabaseAdmin:{from:()=>({select:()=>({order:async()=>({data:state.feeds,error:state.error})})})}}));
import { inspectFeed, readImportFeeds } from './awin-feeds.server';
import { normalizeAwinProduct } from './awin-catalog';
import { awinRuleDiscard } from './awin-rules';
const url='https://productdata.awin.com/datafeed/download/apikey/test-key-1234';
const csv='merchant_id,merchant_name,product_name,search_price,aw_deep_link,aw_product_id,merchant_category\n77,Loja Nova,Notebook,99,https://awin1.com/x,12,Informática\n';
afterEach(()=>vi.unstubAllGlobals());
describe('feeds privados Awin',()=>{
 it('usa segredo só quando tabela vazia, nunca quando todos os feeds estão pausados',async()=>{
  state.feeds=[];expect(await readImportFeeds(url)).toEqual([{id:null,nome:'Feed atual',url}]);
  state.feeds=[{id:'a',nome:'A',url,ativo:false}];expect(await readImportFeeds(url)).toEqual([]);
  state.feeds.push({id:'b',nome:'B',url,ativo:true});expect(await readImportFeeds(url)).toEqual([{id:'b',nome:'B',url}]);
 });

 it('aceita apenas HTTPS no domínio exato sem credenciais nem redirecionamento',async()=>{
  expect(validateFeedUrl(url)).toBe(url);
  for(const bad of ['http://productdata.awin.com/x','https://productdata.awin.com.evil.test/x','https://evil.test/x','https://user:pass@productdata.awin.com/x']) expect(()=>validateFeedUrl(bad)).toThrow();
  const fetcher=vi.fn(()=>Promise.resolve(new Response(csv)));vi.stubGlobal('fetch',fetcher);await openFeed(url);
  expect(fetcher.mock.calls[0][1].redirect).toBe('error');
 });
 it('retorna somente quatro dígitos da chave, sem caminho ou parâmetros privados',()=>{
  const masked=maskFeedUrl(url+'?secret=hidden');expect(masked).toContain('••••1234');expect(masked).not.toContain('test-key');expect(masked).not.toContain('hidden');
 });
 it('teste lê no máximo 200 linhas e retorna três exemplos',async()=>{
  vi.stubGlobal('fetch',()=>Promise.resolve(new Response(csv.split('\n')[0]+'\n'+csv.split('\n')[1].concat('\n').repeat(500))));
  const result=await inspectFeed(url);expect(result.rows).toBe(200);expect(result.examples).toHaveLength(3);expect(result.merchants).toEqual([{id:'77',name:'Loja Nova'}]);expect(result.missing).toEqual([]);
 });
 it('aplica limite de 300 KB e tempo de 20s',async()=>{
  expect(FEED_TEST_MAX_BYTES).toBe(307200);expect(FEED_TEST_MAX_ROWS).toBe(200);expect(FEED_TEST_TIMEOUT_MS).toBe(20000);
  vi.stubGlobal('fetch',()=>Promise.resolve(new Response('x'.repeat(500000))));
  const stream=await openFeed(url,{limited:true});const reader=stream.getReader();let text='';for(;;){const {value,done}=await reader.read();if(done)break;text+=value;}expect(text.length).toBe(307200);
 });
 it('lê gzip e CSV com aspas usando o mesmo leitor',async()=>{
  vi.stubGlobal('fetch',()=>Promise.resolve(new Response(gzipSync(csv.replace('Notebook','"Note, book"')))));
  const rows=[];for await(const row of parseCsv(await openFeed(url,{limited:true}))) rows.push(row);
  expect(rows[0].product_name).toBe('Note, book');
 });
 it('não considera registro cortado no limite como anunciante completo',async()=>{
  const stream=new ReadableStream({start(c){c.enqueue('merchant_id,merchant_name\n77,"Loja cort');c.close();}});
  const rows=[];for await(const row of parseCsv(stream,{partial:true}))rows.push(row);expect(rows).toEqual([]);
 });
 it('informa colunas faltando e não aprova feed inválido',async()=>{
  vi.stubGlobal('fetch',()=>Promise.resolve(new Response('merchant_name\nLoja Nova\n')));const result=await inspectFeed(url);expect(result.valid).toBe(false);expect(result.missing).toContain('search_price');
 });
 it('erro de conexão não retorna a URL com chave',async()=>{
  vi.stubGlobal('fetch',()=>Promise.reject(new Error(url)));await expect(inspectFeed(url)).rejects.toThrow('Não foi possível testar');
  try{await inspectFeed(url);}catch(e){expect(e.message).not.toContain('1234');}
 });
 it('regra padrão de loja nova libera todas e exclui gift card/cartão presente, limite 20000',()=>{
  const rule={merchant:'Loja Nova',category_terms:['*'],excluded_category_terms:['gift card','cartão presente'],max_products:20000};
  expect(rule.max_products).toBe(20000);expect(awinRuleDiscard({merchant_name:'Loja Nova',merchant_category:'Informática'},[rule])).toBeNull();
  for(const category of ['Gift card','Cartão presente'])expect(awinRuleDiscard({merchant_name:'Loja Nova',merchant_category:category},[rule])).toBe('categoria não permitida');
 });
 it('mesmo produto em feeds distintos mantém a mesma chave de gravação',()=>{
  const row={merchant_id:'77',merchant_name:'Loja Nova',product_name:'Notebook',search_price:'99',aw_deep_link:'https://awin1.com/x',aw_product_id:'12',currency:'BRL'};
  const a=normalizeAwinProduct(row,'2026-11-09'),b=normalizeAwinProduct({...row},'2026-11-10');expect(a.objectID).toBe('awin-77-12');expect(b.objectID).toBe(a.objectID);
 });
 it('feed que falha não bloqueia seguintes e lotes mantêm numeração global',async()=>{
  const writes=[],results=[];const result=await processFeedSequence([{id:'a',url:'a'},{id:'b',url:'b'},{id:'c',url:'c'}],{
   read:async(u,count)=>{if(u==='b')throw Error('private-url');const rows=Array.from({length:101},(_,i)=>({id:i}));rows.forEach(count);return rows;},
   batch:async(n,rows)=>writes.push([n,rows.length]),record:async(...args)=>results.push(args)
  });expect(writes).toEqual([[0,100],[1,1],[2,100],[3,1]]);expect(results).toEqual([['a',101,true],['b',0,false],['c',101,true]]);expect(result.failures).toBe(1);
 });
});
