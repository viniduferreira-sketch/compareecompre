import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
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
  const result = await db.from('awin_feeds').select('*').order('created_at');
  if (result.error) throw new Error('Não foi possível listar os feeds.');
  const {maskFeedUrl} = await import('./awin-feeds.server');
  return {feeds:(result.data ?? []).map(({url,...feed})=>({...feed,url_mascarada:maskFeedUrl(url)})),canBringSecret: !(result.data ?? []).some(f=>f.origem_segredo) && Boolean(process.env['AWIN_FEED_URL'])};
});
export const testAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(urlInput).handler(async ({data,context}) => {
  await admin(context); const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  return inspectFeed(validateFeedUrl(data.url));
});
export const testSavedAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.string().uuid()).handler(async ({data,context}) => {
  const db = await admin(context); const feed = await db.from('awin_feeds').select('url').eq('id',data).single();
  if (feed.error || !feed.data) throw new Error('Feed não encontrado.');
  const {inspectFeed} = await import('./awin-feeds.server');
  try {
    const result = await inspectFeed(feed.data.url);
    const saved = await db.from('awin_feeds').update({ultimo_teste_em:new Date().toISOString(),ultimo_teste_status:result.valid?'ok':'colunas ausentes',anunciantes:result.merchants.map(m=>m.name)}).eq('id',data);
    if (saved.error) throw new Error('Não foi possível registrar o teste.');
    return result;
  } catch {
    await db.from('awin_feeds').update({ultimo_teste_em:new Date().toISOString(),ultimo_teste_status:'falha no teste'}).eq('id',data);
    throw new Error('Falha no teste: confira o acesso ao feed e seu formato.');
  }
});
export const saveAwinFeed = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(urlInput).handler(async ({data,context}) => {
  const db = await admin(context); const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  const url = validateFeedUrl(data.url); const test = await inspectFeed(url);
  if (!test.valid) throw new Error('Feed sem anunciantes ou colunas obrigatórias. Não foi salvo.');
  const saved = await db.rpc('save_awin_feed',{_id:data.id ?? null as unknown as string,_nome:data.nome || test.merchants.map(m=>m.name).join(', ').slice(0,200),_url:url,_merchants:test.merchants,_secret:false});
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
  const existing = await db.from('awin_feeds').select('id').eq('origem_segredo',true).maybeSingle();
  if (existing.error || existing.data) throw new Error('O feed atual já foi trazido ou não pôde ser conferido.');
  const secret = process.env['AWIN_FEED_URL']; if (!secret) throw new Error('Feed atual não configurado.');
  const {inspectFeed,validateFeedUrl} = await import('./awin-feeds.server');
  const url=validateFeedUrl(secret); const test=await inspectFeed(url);
  if (!test.valid) throw new Error('O feed atual não passou no teste.');
  const result=await db.rpc('save_awin_feed',{_id:null as unknown as string,_nome:'Feed atual',_url:url,_merchants:test.merchants,_secret:true});
  if (result.error) throw new Error('Não foi possível trazer o feed atual.');
  return {ok:true};
});
