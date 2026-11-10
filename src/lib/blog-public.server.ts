import {createClient} from '@supabase/supabase-js';
import type {Database} from '@/integrations/supabase/types';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {BlogArticle} from './blog-public';
import {sanitizeArticle} from './blog-sanitize';
export function blogPublicClient(url:string,key:string){return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(headers.get('Authorization')===`Bearer ${key}`&&key.startsWith('sb_'))headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});}
export const articleColumns='id,titulo,slug,resumo,corpo,titulo_seo,descricao_seo,imagem_url,imagem_alt,imagem_credito,categoria_id,autor_id,status,publicado_em,visualizacoes,criado_em,atualizado_em';
export async function enrichArticles(db:SupabaseClient<Database>,posts:Database['public']['Tables']['posts']['Row'][]):Promise<BlogArticle[]>{
 if(!posts.length)return [];
 const [categories,authors,relations]=await Promise.all([db.from('categorias').select('id,nome,slug').in('id',[...new Set(posts.flatMap(p=>p.categoria_id?[p.categoria_id]:[]))]),db.from('autores').select('id,nome,foto_url,biografia').in('id',[...new Set(posts.flatMap(p=>p.autor_id?[p.autor_id]:[]))]),db.from('post_tags').select('post_id,tag_id').in('post_id',posts.map(p=>p.id))]);
 if(categories.error||authors.error||relations.error)throw new Error('Não foi possível carregar os detalhes dos artigos.');
 const ids=[...new Set((relations.data??[]).map(t=>t.tag_id))];
 const tags=ids.length?await db.from('tags').select('id,nome,slug').in('id',ids):{data:[],error:null};
 if(tags.error)throw new Error('Não foi possível carregar as tags.');
 return posts.map(p=>({...p,corpo:sanitizeArticle(p.corpo),category:categories.data?.find(c=>c.id===p.categoria_id)??null,author:authors.data?.find(a=>a.id===p.autor_id)??null,tags:(tags.data??[]).filter(t=>relations.data?.some(r=>r.post_id===p.id&&r.tag_id===t.id))}));
}