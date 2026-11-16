import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {BlogShell,BlogCard} from '@/components/blog/BlogPages';
import {Button} from '@/components/ui/button';
import {eduardoProfileQuery,eduardoArticlesQuery} from '@/lib/author-profile.queries';
import {BLOG_ORIGIN,BLOG_PAGE_SIZE} from '@/lib/blog-public';
import {EDUARDO_BIO} from '@/lib/eduardo-profile';

export const Route=createFileRoute('/autor/eduardo-ferreira')({
  staticData:{sitemap:true},
  validateSearch:(v:Record<string,unknown>):{pagina?:number}=>({pagina:Math.max(1,Math.min(100000,Math.floor(Number(v['pagina'])||1)))}),
  loaderDeps:({search})=>({page:search.pagina??1}),
  loader:async({context,deps})=>{const [author]=await Promise.all([context.queryClient.ensureQueryData(eduardoProfileQuery()),context.queryClient.ensureQueryData(eduardoArticlesQuery(deps.page))]);return author;},
  head:({loaderData,match})=>{const page=match.search.pagina??1;const title=`Eduardo Ferreira — Criador do Compare e Compre${page>1?` — Página ${page}`:''}`;const url=`${BLOG_ORIGIN}/autor/eduardo-ferreira${page>1?`?pagina=${page}`:''}`;const photo=loaderData?.foto_url;return {meta:[{title},{name:'description',content:EDUARDO_BIO},{property:'og:title',content:title},{property:'og:description',content:EDUARDO_BIO},{property:'og:type',content:'profile'},{name:'twitter:card',content:'summary_large_image'},...(photo?.startsWith('https://')?[{property:'og:image',content:photo},{name:'twitter:image',content:photo}]:[])],links:[{rel:'canonical',href:url}]};},
  component:AuthorPage,
});
function AuthorPage(){
  const page=Route.useSearch().pagina??1;
  const {data:author}=useSuspenseQuery(eduardoProfileQuery());
  const {data}=useSuspenseQuery(eduardoArticlesQuery(page));
  const pages=Math.ceil(data.total/BLOG_PAGE_SIZE);
  return <BlogShell><main className="mx-auto max-w-6xl px-5 py-10"><nav className="mb-7 text-sm text-muted-foreground"><Link to="/blog">Blog</Link> / Eduardo Ferreira</nav><header className="flex flex-col items-start gap-6 border-b border-border pb-8 sm:flex-row">{author.foto_url&&<img src={author.foto_url} alt="Eduardo Ferreira" width={160} height={160} className="size-32 shrink-0 rounded-full object-cover"/>}<div className="max-w-2xl"><h1 className="text-3xl font-bold">Eduardo Ferreira</h1><p className="mt-2 font-semibold text-primary">Criador do Compare e Compre</p><p className="mt-4 leading-7 text-muted-foreground">{EDUARDO_BIO}</p><a href="mailto:contato@compareecompre.com.br" className="mt-4 inline-block text-sm text-primary underline">contato@compareecompre.com.br</a></div></header><section className="pt-8"><h2 className="mb-6 text-2xl font-bold">Artigos de Eduardo Ferreira</h2>{data.posts.length?<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.posts.map(post=><BlogCard key={post.id} post={post}/>)}</div>:<p className="text-muted-foreground">Nenhum artigo nesta página.</p>}</section>{pages>1&&<nav aria-label="Paginação" className="mt-8 flex flex-wrap justify-center gap-3">{page>1&&<Button asChild variant="outline"><Link to="/autor/eduardo-ferreira" search={{pagina:page-1}}>Anterior</Link></Button>}<span className="py-2 text-sm text-muted-foreground">Página {page} de {pages}</span>{page<pages&&<Button asChild variant="outline"><Link to="/autor/eduardo-ferreira" search={{pagina:page+1}}>Próxima</Link></Button>}</nav>}</main></BlogShell>;
}