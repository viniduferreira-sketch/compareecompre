import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { awinSyncScope, assertAwinFeedRows, awinFeedOutcome } from './awin-sync-scope';

const state = vi.hoisted(() => ({
  calls: [] as Array<{table:string;operation:string;value?:unknown}>,
  active: null as null | {id:string}, duplicate: false, missing: false,
  existing: false, jobStatus:'running', scope: {feedId:'feed-nike',merchants:['Nike BR']},
}));
vi.mock('@/integrations/supabase/client.server', () => ({supabaseAdmin:{rpc:async(name:string)=>{state.calls.push({table:'rpc',operation:name});return {data:0,error:null};},from:(table:string) => {
  let filterId:string|undefined; let inserting = false;
  const chain = {
    select:(value:string)=>{state.calls.push({table,operation:'select',value});return chain;},
    eq:(key:string,value:string)=>{if(key==='id')filterId=value;state.calls.push({table,operation:'eq',value:[key,value]});return chain;},
    in:()=>chain, lt:()=>chain,
    order:()=>{throw new Error('Single sync must not list other feeds');},
    insert:(value:unknown)=>{inserting=true;state.calls.push({table,operation:'insert',value});return chain;},
    update:(value:unknown)=>{state.calls.push({table,operation:'update',value});return chain;},
    single:async()=> table==='awin_feeds'
      ? {data:state.missing?null:{id:filterId,nome:'Nike',anunciantes:['Nike BR'],url:'https://productdata.awin.com/nike'},error:null}
      : {data:state.duplicate?null:{id:'job',status:state.jobStatus,sync_cursor:state.scope},error:inserting&&state.duplicate?{code:'23505'}:null},
    maybeSingle:async()=>({data:state.existing?{id:'job',status:state.jobStatus,sync_cursor:state.scope}:state.active,error:null}),
    then:(resolve:(v:unknown)=>unknown)=>resolve({error:null}),
  };return chain;
}}}));
vi.mock('./algolia-indexing.server',()=>({ensureIdentifierFacets:vi.fn(),getAlgoliaIndexingConfig:vi.fn()}));
import { dispatchAwinImport } from './awin-dispatch.server';
import { handleAwinImport } from './awin-import.server';
import { readImportFeeds } from './awin-feeds.server';

beforeEach(()=>{
  state.calls=[];state.active=null;state.duplicate=false;state.missing=false;state.existing=false;state.jobStatus='running';
  vi.stubEnv('GITHUB_API_KEY','test-key');vi.stubEnv('LOVABLE_API_KEY','test-lovable');vi.stubEnv('AWIN_FEED_URL','https://productdata.awin.com/all');
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(null,{status:204})));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});

describe('sincronização individual Awin',()=>{
  it('late finish cannot overwrite a cancelled or expired execution',async()=>{
    for(const status of ['cancelled','expired']){state.jobStatus=status;state.calls=[];await handleAwinImport('123',{action:'finish',importId:'job',success:false});expect(state.calls.some(c=>c.operation==='update')).toBe(false);}
  });
  it('workflow final cancellation records cancelled without touching products',async()=>{
    state.existing=true;await handleAwinImport('123',{action:'workflowEnd',importId:'job',conclusion:'cancelled'});
    expect(state.calls.find(c=>c.operation==='update')?.value).toMatchObject({status:'cancelled'});
    expect(state.calls.some(c=>c.table==='partner_catalog')).toBe(false);
  });
  it('workflow final failure records failed',async()=>{
    state.existing=true;await handleAwinImport('123',{action:'workflowEnd',importId:'job',conclusion:'failure'});
    expect(state.calls.find(c=>c.operation==='update')?.value).toMatchObject({status:'failed'});
  });
  it('reserva a seleção antes do disparo e usa o workflow existente somente com import_id',async()=>{
    expect(await dispatchAwinImport('feed-nike')).toEqual({id:'job'});
    expect(state.calls.find(c=>c.operation==='insert')?.value).toEqual({source:'awin',status:'queued',sync_cursor:{feedId:'feed-nike',merchants:['Nike BR']}});
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0]?.[1]?.body as string)).toEqual({ref:'main',inputs:{import_id:'job'}});
    expect(state.calls.filter(c=>c.table==='awin_feeds'&&c.operation==='eq').map(c=>c.value)).toEqual([['id','feed-nike']]);
  });
  it('avisa se há execução ativa, sem reservar ou disparar outra',async()=>{
    state.active={id:'other'};
    await expect(dispatchAwinImport('feed-nike')).rejects.toThrow('em andamento');
    expect(fetch).not.toHaveBeenCalled();expect(state.calls.some(c=>c.operation==='insert')).toBe(false);
  });
  it('também bloqueia a corrida entre duas reservas com a restrição única',async()=>{
    state.duplicate=true;
    await expect(dispatchAwinImport('feed-nike')).rejects.toThrow('em andamento');expect(fetch).not.toHaveBeenCalled();
  });
  it('mantém a sincronização geral sem seleção de feeds',async()=>{
    await dispatchAwinImport();
    expect(state.calls.find(c=>c.operation==='insert')?.value).toEqual({source:'awin',status:'queued',sync_cursor:null});
    expect(state.calls.some(c=>c.table==='awin_feeds')).toBe(false);
  });
  it('limpeza de trabalhos abandonados fica restrita à Awin',async()=>{
    await dispatchAwinImport('feed-nike');
    expect(state.calls).toContainEqual({table:'catalog_imports',operation:'eq',value:['source','awin']});
    expect(state.calls.some(c=>c.table==='partner_catalog')).toBe(false);
  });
  it('o início do importador lê só o feed da seleção persistida',async()=>{
    const result=await handleAwinImport('123',{action:'start',importId:'job'});
    expect(result).toEqual({importId:'job',feeds:[{id:'feed-nike',nome:'Nike',url:'https://productdata.awin.com/nike'}]});
    expect(state.calls.filter(c=>c.table==='awin_feeds'&&c.operation==='eq').map(c=>c.value)).toEqual([['id','feed-nike']]);
  });
  it('repetir start conserva o escopo e não lê os outros feeds',async()=>{
    state.existing=true;
    const result=await handleAwinImport('123',{action:'start',importId:'job'});
    expect(result).toMatchObject({feeds:[{id:'feed-nike'}]});
    expect(state.calls.some(c=>c.operation==='insert')).toBe(false);
  });
  it('feed removido falha fechado, sem fallback para segredo ou outros feeds',async()=>{
    state.missing=true;
    await expect(readImportFeeds('https://productdata.awin.com/all','feed-nike')).rejects.toThrow('Nenhum outro feed');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('aceita a loja selecionada e rejeita KaBuM antes de qualquer lote ser gravado',()=>{
    expect(()=>assertAwinFeedRows(state.scope,[{merchant_name:'Nike BR'}])).not.toThrow();
    expect(()=>assertAwinFeedRows(state.scope,[{merchant_name:'KaBuM'}])).toThrow('Lote não importado');
  });
  it('o importador rejeita lote de outra loja antes de gravar catálogo, limites ou histórico',async()=>{
    await expect(handleAwinImport('123',{action:'batch',importId:'job',batch:0,rows:[{merchant_name:'KaBuM'}]})).rejects.toThrow('Lote não importado');
    expect(state.calls.some(c=>c.operation==='insert'||c.operation==='update')).toBe(false);
    expect(state.calls.some(c=>c.table==='partner_catalog'||c.table==='catalog_import_batches')).toBe(false);
  });
  it('não grava o resultado de outro feed em uma execução individual',async()=>{
    await expect(handleAwinImport('123',{action:'feedResult',importId:'job',feedId:'feed-kabum',linhas:804,success:true})).rejects.toThrow('outro feed');
    expect(state.calls.some(c=>c.operation==='update'||c.operation==='insert')).toBe(false);
    expect(state.calls.some(c=>c.table==='awin_feed_import_results')).toBe(false);
  });
  it('não transforma escopo corrompido ou sem anunciantes em sincronização geral',()=>{
    expect(awinSyncScope(null)).toBeNull();
    expect(()=>awinSyncScope({feedId:'feed-nike',merchants:[]})).toThrow();
    expect(()=>awinSyncScope({unrelated:true})).toThrow();
  });
  it('falha de outro feed não altera o resultado deste feed',()=>{
    expect(awinFeedOutcome({status:'completed',erro:null,linhas:804},{status:'failed',error:'Outro feed falhou'})).toEqual({status:'completed',error:null,lines:804});
    expect(awinFeedOutcome(null,{status:'failed',error:'Não iniciou'})).toEqual({status:'failed',error:'Não iniciou',lines:null});
  });
  it('preserva resultado bem-sucedido do feed e estados pendentes',()=>{
    expect(awinFeedOutcome({status:'completed',erro:null,linhas:804},{status:'completed',error:null})).toEqual({status:'completed',error:null,lines:804});
    expect(awinFeedOutcome(null,{status:'queued',error:null})).toEqual({status:'queued',error:null,lines:null});
  });
  it('falha de disparo encerra a reserva e não revela erro privado',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('https://secret.test/private-key');}));
    await expect(dispatchAwinImport('feed-nike')).rejects.toThrow('Não foi possível iniciar');
    expect(state.calls.some(c=>c.operation==='update'&&JSON.stringify(c.value).includes('Não foi possível iniciar'))).toBe(true);
  });
});