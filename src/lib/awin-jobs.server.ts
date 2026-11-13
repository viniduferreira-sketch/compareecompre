import { githubAwinConclusion } from './awin-job-status';

async function githubRun(runId: string, cancel = false) {
  const key=process.env['GITHUB_API_KEY'], token=process.env['LOVABLE_API_KEY'];
  if (!key || !token) throw new Error('Integração com GitHub indisponível.');
  const response=await fetch(`https://connector-gateway.lovable.dev/github/repos/viniduferreira-sketch/compareecompre/actions/runs/${encodeURIComponent(runId)}${cancel?'/cancel':''}`,{
    method:cancel?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'X-Connection-Api-Key':key,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Never return provider bodies, which may contain private repository metadata.
    console.error('Awin GitHub status',response.status);
    if(response.status===404||response.status===409)return null;
    throw new Error(`GitHub não respondeu ao controle da execução (HTTP ${response.status}).`);
  }
  return cancel?{conclusion:null}:await response.json() as {conclusion?:string|null};
}
export async function reconcileAwinJobs() {
  const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
  const active=await db.from('catalog_imports').select('id,github_run_id').eq('source','awin').in('status',['queued','running']);
  if(active.error)throw new Error('Não foi possível conferir as execuções Awin.');
  for(const job of active.data??[]) {
    if(!job.github_run_id)continue;
    try {
      const run=await githubRun(job.github_run_id);
      const status=githubAwinConclusion(run?.conclusion);
      if(status){const saved=await db.from('catalog_imports').update({status,finished_at:new Date().toISOString(),error:status==='cancelled'?'Execução cancelada no GitHub.':'Execução falhou no GitHub.'}).eq('id',job.id).eq('source','awin').in('status',['queued','running']);if(saved.error)throw saved.error;}
    }catch{console.error('Não foi possível reconciliar execução Awin com GitHub.');}
  }
  const expired=await db.rpc('expire_idle_awin_jobs');
  if(expired.error)throw new Error('Não foi possível conferir execuções expiradas.');
}
export async function cancelAwinJob(id:string) {
  const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
  const result=await db.from('catalog_imports').update({status:'cancelled',finished_at:new Date().toISOString(),error:'Execução cancelada pelo administrador.'}).eq('id',id).eq('source','awin').in('status',['queued','running']).select('github_run_id').maybeSingle();
  if(result.error)throw new Error('Não foi possível cancelar a execução.');
  if(!result.data)return {cancelled:true,warning:null};
  let warning:string|null=null;
  if(result.data.github_run_id){try{const response=await githubRun(result.data.github_run_id,true);if(!response)warning='Cancelada no painel; o GitHub não confirmou a interrupção. Novos lotes desta execução serão recusados.';}catch{warning='Cancelada no painel; não foi possível confirmar a interrupção no GitHub. Novos lotes serão recusados.';}}
  return {cancelled:true,warning};
}