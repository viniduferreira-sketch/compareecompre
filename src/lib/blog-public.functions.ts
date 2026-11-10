import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {BLOG_PAGE_SIZE} from './blog-public';
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
export const listBlogArticles=createServerFn({method:'GET'}).inputValidator((v:{page?:number;kind?:'category'|'tag';slug?:string})=>z.object({page:z.number().int().min(1).max(100000).default(1),kind:z.enum(['category','tag']).optional(),slug:slug.optional()}).parse(v)).handler(async({data})=>{
 const {blogPublicClient,articleColumns,enrichArticles}=await import('./blog-public.server');
 const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
 const now=new Date().toISOString();
 const categories=await db.from('categorias').select('id,nome,slug').order('nome');
 if(categories.error)throw new Error('Não foi possível carregar as categorias.');
 let query=db.from('posts').select(`${articleColumns},post_tags!inner(tag_id)`,{count:'exact'}).in('status',['publicado','agendado']).lte('publicado_em',now).order('publicado_em',{ascending:false}).order('id');
 let selected:{id:string;nome:string;slug:string}|null=null;
 if(data.kind&&data.slug){
  const entity=await db.from(data.kind==='category'?'categorias':'tags').select('id,nome,slug').eq('slug',data.slug).maybeSingle();
  if(entity.error)throw new Error('Não foi possível carregar o filtro.');
  if(!entity.data)return {posts:[],total:0,categories:categories.data??[],selected:null,missing:true,page:data.page};
  selected=entity.data;
  if(data.kind==='category')query=query.eq('categoria_id',entity.data.id);
  else query=query.eq('post_tags.tag_id',entity.data.id);
 }
 const start=(data.page-1)*BLOG_PAGE_SIZE,end=data.page*BLOG_PAGE_SIZE-1;
 const result=data.kind==='tag'?await query.range(start,end):await (()=>{let all=db.from('posts').select(articleColumns,{count:'exact'}).in('status',['publicado','agendado']).lte('publicado_em',now).order('publicado_em',{ascending:false}).order('id');if(selected)all=all.eq('categoria_id',selected.id);return all.range(start,end);})();
 if(result.error)throw new Error('Não foi possível carregar os artigos.');
 return {posts:await enrichArticles(db,result.data??[]),total:result.count??0,categories:categories.data??[],selected,missing:false,page:data.page};
});
export const getPublicBlogArticle=createServerFn({method:'GET'}).inputValidator((v:{slug:string})=>z.object({slug}).parse(v)).handler(async({data})=>{
 const {blogPublicClient,articleColumns,enrichArticles}=await import('./blog-public.server');
 const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
 const result=await db.from('posts').select(articleColumns).eq('slug',data.slug).in('status',['publicado','agendado']).lte('publicado_em',new Date().toISOString()).maybeSingle();
 if(result.error)throw new Error('Não foi possível carregar o artigo.');
 if(!result.data)return null;
 const [post]=await enrichArticles(db,[result.data]);
 let related:Awaited<ReturnType<typeof enrichArticles>>=[];
 if(result.data.categoria_id){const rows=await db.from('posts').select(articleColumns).eq('categoria_id',result.data.categoria_id).neq('id',result.data.id).in('status',['publicado','agendado']).lte('publicado_em',new Date().toISOString()).order('publicado_em',{ascending:false}).limit(4);if(rows.error)throw new Error('Não foi possível carregar os artigos relacionados.');related=await enrichArticles(db,rows.data??[]);}
 return post?{post,related}:null;
});
export const getAdminBlogPreview=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:{id:string})=>z.object({id:z.string().uuid()}).parse(v)).handler(async({context,data})=>{
 setResponseHeader('Cache-Control','private, no-store');
 const role=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).eq('role','admin').maybeSingle();
 if(role.error||!role.data)throw new Error('Prévia restrita ao administrador.');
 const {articleColumns,enrichArticles}=await import('./blog-public.server');
 const row=await context.supabase.from('posts').select(articleColumns).eq('id',data.id).maybeSingle();
 if(row.error)throw new Error('Não foi possível carregar a prévia.');
 if(!row.data)return null;
 const [post]=await enrichArticles(context.supabase,[row.data]);
 return post?{post,related:[]}:null;
});
export const countBlogView=createServerFn({method:'POST'}).inputValidator((v:{id:string})=>z.object({id:z.string().uuid()}).parse(v)).handler(async({data})=>{
 const {blogPublicClient}=await import('./blog-public.server');
 const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
 const {error}=await db.rpc('count_blog_view',{_id:data.id});
 if(error)throw new Error('Não foi possível contar a leitura.');
 return {ok:true};
});