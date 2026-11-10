import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { sanitizeArticle } from './blog-sanitize';
import { blogPostSchema, slugify } from './blog';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
async function admin(db: SupabaseClient<Database>, userId: string) {
 setResponseHeader('Cache-Control','private, no-store');
 const role = await db.from('user_roles').select('role').eq('user_id',userId).eq('role','admin').maybeSingle();
 if(role.error || !role.data) throw new Error('Acesso restrito ao administrador.');
}
export const getBlogData = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input: {page?: number; search?: string; status?: string; category?: string}) => z.object({page:z.number().int().min(0).default(0),search:z.string().max(200).default(''),status:z.enum(['','rascunho','agendado','publicado']).default(''),category:z.string().uuid().or(z.literal('')).default('')}).parse(input)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId);
 let query=context.supabase.from('posts').select('id,titulo,slug,resumo,status,publicado_em,criado_em,atualizado_em,visualizacoes,titulo_seo,descricao_seo,imagem_url,imagem_alt,categoria_id,autor_id',{count:'exact'}).order('criado_em',{ascending:false});
 if(data.search) query=query.ilike('titulo',`%${data.search.replace(/[%_]/g,'')}%`);
 if(data.status==='publicado') query=query.in('status',['publicado','agendado']).lte('publicado_em',new Date().toISOString());
 else if(data.status==='agendado') query=query.eq('status','agendado').gt('publicado_em',new Date().toISOString());
 else if(data.status) query=query.eq('status',data.status);
 if(data.category) query=query.eq('categoria_id',data.category);
 const [posts,categories,tags,authors]=await Promise.all([query.range(data.page*30,data.page*30+29),context.supabase.from('categorias').select('*').order('nome'),context.supabase.from('tags').select('*').order('nome'),context.supabase.from('autores').select('*').order('nome')]);
 for(const result of [posts,categories,tags,authors]) if(result.error) throw new Error('Não foi possível carregar o Blog.');
 return {posts:posts.data??[],total:posts.count??0,categories:categories.data??[],tags:tags.data??[],authors:authors.data??[]};
});
export const getBlogPost=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:{id:string})=>z.object({id:z.string().uuid()}).parse(v)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId);
 const [post,tags]=await Promise.all([context.supabase.from('posts').select('*').eq('id',data.id).single(),context.supabase.from('post_tags').select('tag_id').eq('post_id',data.id)]);
 if(post.error||tags.error) throw new Error('Artigo não encontrado.');
 return {...post.data,tags:(tags.data??[]).map(t=>t.tag_id)};
});
export const saveBlogPost=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>blogPostSchema.parse(v)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId);
 const {tags,...post}=data;
 const result=await context.supabase.rpc('save_blog_post',{_post:{...post,corpo:sanitizeArticle(post.corpo),publicado_em:post.status==='rascunho'?null:post.publicado_em??new Date().toISOString()},_tags:tags});
 if(result.error) throw new Error(result.error.code==='23505'?'Este slug já está em uso. Escolha outro.':'Não foi possível salvar o artigo.');
 return {id:result.data};
});
export const deleteBlogPost=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:{id:string})=>z.object({id:z.string().uuid()}).parse(v)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId); const result=await context.supabase.from('posts').delete().eq('id',data.id); if(result.error) throw new Error('Não foi possível excluir.'); return {ok:true};
});
const entity=z.object({kind:z.enum(['categorias','tags','autores']),id:z.string().uuid().optional(),nome:z.string().trim().min(1).max(200),foto_url:z.string().max(2048).refine(v=>!v||/^https:\/\//.test(v)||/^\/api\/public\/blog-image\/[a-f0-9-]+\.webp$/.test(v)).default(''),biografia:z.string().max(3000).default('')});
export const saveBlogEntity=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>entity.parse(v)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId);
 if(data.kind!=='autores'&&!slugify(data.nome)) throw new Error('Informe um nome válido.');
 const common={...(data.id?{id:data.id}:{}),nome:data.nome};
 const result=data.kind==='autores'
  ? await context.supabase.from('autores').upsert({...common,foto_url:data.foto_url,biografia:data.biografia}).select().single()
  : data.kind==='categorias'
  ? await context.supabase.from('categorias').upsert({...common,slug:slugify(data.nome)}).select().single()
  : await context.supabase.from('tags').upsert({...common,slug:slugify(data.nome)}).select().single();
 if(result.error) throw new Error(result.error.code==='23505'?'Já existe um cadastro com esse nome.':'Não foi possível salvar.'); return result.data;
});
export const deleteBlogEntity=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:{kind:string;id:string})=>z.object({kind:z.enum(['categorias','tags','autores']),id:z.string().uuid()}).parse(v)).handler(async({context,data})=>{
 await admin(context.supabase,context.userId); const result=await context.supabase.from(data.kind).delete().eq('id',data.id); if(result.error)throw new Error('Não foi possível excluir.'); return {ok:true};
});
