import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {EDUARDO_AUTHOR_ID} from './eduardo-profile';
import {BLOG_PAGE_SIZE} from './blog-public';
import {readBlogPage} from './blog-pagination';

export const getEduardoProfile = createServerFn({method:'GET'}).handler(async()=>{
  const {blogPublicClient}=await import('./blog-public.server');
  const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
  const result=await db.from('autores').select('id,nome,foto_url,biografia').eq('id',EDUARDO_AUTHOR_ID).maybeSingle();
  if(result.error)throw new Error('Não foi possível carregar o autor.');
  return result.data;
});
export const getEduardoArticles=createServerFn({method:'GET'}).inputValidator((input:{page:number})=>z.object({page:z.number().int().min(1).max(100000)}).parse(input)).handler(async({data})=>{
  const {blogPublicClient,articleColumns,enrichArticles}=await import('./blog-public.server');
  const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
  const query=db.from('posts').select(articleColumns,{count:'exact'}).eq('autor_id',EDUARDO_AUTHOR_ID).in('status',['publicado','agendado']).lte('publicado_em',new Date().toISOString()).order('publicado_em',{ascending:false}).order('id');
  const result=await readBlogPage((from,to)=>query.range(from,to),(data.page-1)*BLOG_PAGE_SIZE,data.page*BLOG_PAGE_SIZE-1);
  return {posts:await enrichArticles(db,result.rows),total:result.total};
});