import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { awinFeedOutcome } from './awin-sync-scope';
async function admin(context: {userId:string;supabase:SupabaseClient<Database>}) {
  setResponseHeader('Cache-Control','no-store');
  const role = await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).eq('role','admin').maybeSingle();
  if (role.error || !role.data) throw new Error('Acesso restrito ao administrador.');
  return (await import('@/integrations/supabase/client.server')).supabaseAdmin;
}
function urlInput(input: unknown) {
  // Never use a validator that includes submitted credentials in validation errors.
  const parsed = z.object({url:z.string().min(1).max(8000),nome:z.string().trim().max(200).optional(),id:z.string().uuid().optional()}).safeParse(input);
  if (!parsed.success) throw new Error('Dados do feed inválidos.');
  return parsed.data;
}
export const getAwinFeeds = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const db = await admin(context);
  const {reconcileAwinJobs}=await import('./awin-jobs.server');
  await reconcileAwinJobs();
  const result = await db.from('awin_feeds').select('*').order('created_at');
  if (result.error) throw new Error('Não foi possível listar os feeds.');
  const marker = await db.from('awin_feed_settings').select('secret_migrated').eq('singleton',true).maybeSingle();
  if(marker.error) throw new Error('Não foi possível conferir o feed atual.');
  const {maskFeedUrl} = await import('./awin-feeds.server');
  const active = await db.from('catalog_imports').select('id,sync_cursor,status,created_at').eq('source','awin').in('status',['queued','running']).maybeSingle();
  if (active.error) throw new Error('Não foi possível conferir o andamento das sincronizações.');
  const feeds = await Promise.all((result.data ?? []).map(async ({url,...feed}) => {
    const [history, individual] = await Promise.all([
      db.from('awin_feed_import_results').select('created_at,status,erro,linhas,catalog_imports(status,error,created_at)').eq('feed_id',feed.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      db.from('catalog_imports').select('status,error,created_at,finished_at').eq('source','awin').contains('sync_cursor',{feedId:feed.id}).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    if (history.error || individual.error) throw new Error('Não foi possível ler o histórico do feed.');
    const h = history.data;
    const i = individual.data;
    const isLatestIndividual = Boolean(i && (!h || i.created_at > (h.catalog_imports?.created_at ?? h.created_at)));
    const outcome = isLatestIndividual ? awinFeedOutcome(null,i) : awinFeedOutcome(h,h?.catalog_imports ?? null);
    const latestAt = isLatestIndividual ? i?.finished_at ?? i?.created_at : h?.created_at;
    return {...feed,url_mascarada:maskFeedUrl(url),lastSync: outcome ? {...outcome, date:latestAt ?? null} : null};
  }));
  return {feeds, syncInProgress:Boolean(active.data), canBringSecret: !marker.data?.secret_migrated && Boolean(process.env['AWIN_FEED_URL'])};
});
export const syncAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.string().uuid()).handler(async ({data,context}) => {
  await admin(context);
  const { dispatchAwinImport } = await import('./awin-dispatch.server');
  return dispatchAwinImport(data);
});
export const testAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(urlInput).handler(async ({data,context}) => {
  await admin(context); const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  return inspectFeed(validateFeedUrl(data.url));
});
export const testSavedAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.string().uuid()).handler(async ({data,context}) => {
  const db = await admin(context); const feed = await db.from('awin_feeds').select('url').eq('id',data).single();
  if (feed.error || !feed.data) throw new Error('Feed não encontrado.');
  const {inspectFeed} = await import('./awin-feeds.server');
  const result = await inspectFeed(feed.data.url);
  const d = result.diagnostics;
  const status = result.valid ? 'ok' : `${result.error ?? 'Colunas ou anunciantes ausentes'} · HTTP ${d.httpStatus ?? 'sem resposta'} · ${d.elapsedMs} ms · ${d.bytesRead} bytes · ${d.header.length} colunas`;
  const saved = await db.from('awin_feeds').update({ultimo_teste_em:new Date().toISOString(),ultimo_teste_status:status,...(result.valid?{anunciantes:result.merchants.map(m=>m.name)}:{})}).eq('id',data);
  return {...result,recordingError:saved.error?'O resultado não pôde ser registrado.':null};
});
export const saveAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(urlInput).handler(async ({data,context}) => {
  const db = await admin(context); const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  const url = validateFeedUrl(data.url); const test = await inspectFeed(url);
  if (!test.valid) throw new Error(test.error ?? 'Feed sem anunciantes ou colunas obrigatórias. Não foi salvo.');
  const saved = await db.rpc('save_awin_feed',{...(data.id ? {_id:data.id} : {}),_nome:data.nome || test.merchants.map(m=>m.name).join(', ').slice(0,200),_url:url,_merchants:test.merchants,_secret:false});
  if (saved.error) throw new Error('Não foi possível salvar o feed e seus anunciantes.');
  return {id:saved.data,anunciantes:test.merchants.map(m=>m.name)};
});
export const changeAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),action:z.enum(['pause','activate','remove'])})).handler(async ({data,context}) => {
  const db = await admin(context);
  const result = data.action==='remove' ? await db.from('awin_feeds').delete().eq('id',data.id) : await db.from('awin_feeds').update({ativo:data.action==='activate'}).eq('id',data.id);
  if (result.error) throw new Error('Não foi possível alterar o feed.');
  return {ok:true};
});
export const bringAwinSecret = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const db = await admin(context);
  const existing = await db.from('awin_feed_settings').select('secret_migrated').eq('singleton',true).maybeSingle();
  if (existing.error || existing.data?.secret_migrated) throw new Error('O feed atual já foi trazido ou não pôde ser conferido.');
  const secret = process.env['AWIN_FEED_URL']; if (!secret) throw new Error('Feed atual não configurado.');
  const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  const url=validateFeedUrl(secret); const test=await inspectFeed(url);
  if (!test.valid) throw new Error(test.error ?? 'O feed atual não passou no teste.');
  const result=await db.rpc('save_awin_feed',{_nome:'Feed atual',_url:url,_merchants:test.merchants,_secret:true});
  if (result.error) throw new Error('Não foi possível trazer o feed atual.');
  return {ok:true};
});
