import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { showcaseSchema, type Showcase } from './home-showcases';
async function requireAdmin(context: {supabase: SupabaseClient<Database>; userId: string}) {
  setResponseHeader('Cache-Control','private, no-store');
  const role = await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).eq('role','admin').maybeSingle();
  if (role.error || !role.data) throw new Error('Acesso restrito ao administrador.');
}
export const publicShowcases = createServerFn({method:'GET'}).handler(async (): Promise<Showcase[]> => {
  const key=process.env['SUPABASE_PUBLISHABLE_KEY']; const url=process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('Vitrines indisponíveis.');
  const db=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});
  const result=await db.from('home_showcases').select('id,title,subtitle,category_slug,terms,sort_order,active,label,stores,min_price,max_price,store_quota').eq('active',true).order('sort_order').order('id').limit(30);
  if(result.error)throw new Error('Não foi possível carregar as vitrines.');
  return result.data ?? [];
});
export const adminShowcases = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}): Promise<Showcase[]> => {
  await requireAdmin(context);
  const result=await context.supabase.from('home_showcases').select('id,title,subtitle,category_slug,terms,sort_order,active,label,stores,min_price,max_price,store_quota').order('sort_order').order('id');
  if(result.error)throw new Error('Não foi possível ler as vitrines.'); return result.data ?? [];
});
export const saveShowcase = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(showcaseSchema).handler(async ({context,data}) => {
  await requireAdmin(context); const {id,...fields}=data;
  const row={...fields,updated_at:new Date().toISOString()};
  const result=id ? await context.supabase.from('home_showcases').update(row).eq('id',id).select('id').single() : await context.supabase.from('home_showcases').insert(row).select('id').single();
  if(result.error)throw new Error('Não foi possível salvar a vitrine.'); return {saved:true};
});