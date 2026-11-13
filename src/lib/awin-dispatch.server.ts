import { awinSyncScope } from './awin-sync-scope';

/** Both manual entry points reserve the same database-wide per-source unique lock. */
export async function dispatchAwinImport(feedId?: string) {
  const key = process.env['GITHUB_API_KEY'];
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (!key || !lovableKey || (!feedId && !process.env['AWIN_FEED_URL'])) throw new Error('A integração ainda não está configurada.');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const {reconcileAwinJobs}=await import('./awin-jobs.server');
  await reconcileAwinJobs();
  const active = await db.from('catalog_imports').select('id').eq('source', 'awin').in('status', ['queued', 'running']).maybeSingle();
  if (active.error) throw new Error('Não foi possível conferir o andamento.');
  if (active.data) throw new Error('Já existe uma sincronização Awin em andamento. Aguarde sua conclusão.');
  let scope = null;
  if (feedId) {
    // No other feed (or private URL) is read during this request.
    const selected = await db.from('awin_feeds').select('id,anunciantes').eq('id', feedId).single();
    if (selected.error || !selected.data) throw new Error('Feed não encontrado.');
    scope = awinSyncScope({ feedId: selected.data.id, merchants: selected.data.anunciantes });
  }
  const { data: job, error } = await db.from('catalog_imports').insert({ source: 'awin', status: 'queued', sync_cursor: scope }).select('id').single();
  if (error?.code === '23505') throw new Error('Já existe uma sincronização Awin em andamento. Aguarde sua conclusão.');
  if (error || !job) throw new Error('Não foi possível reservar a sincronização.');
  try {
    const response = await fetch('https://connector-gateway.lovable.dev/github/repos/viniduferreira-sketch/compareecompre/actions/workflows/awin-import.yml/dispatches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': key, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { import_id: job.id } }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub recusou o disparo (${response.status}). Confirme que a rotina já chegou ao repositório.`);
    return { id: job.id };
  } catch (error) {
    await db.from('catalog_imports').update({ status: 'failed', finished_at: new Date().toISOString(), error: 'Não foi possível iniciar a execução no GitHub.' }).eq('id', job.id).eq('source', 'awin');
    // Never expose a gateway response or credential-bearing fetch exception.
    if (error instanceof Error && error.message.startsWith('GitHub recusou')) throw error;
    throw new Error('Não foi possível iniciar a execução no GitHub. Tente novamente.');
  }
}