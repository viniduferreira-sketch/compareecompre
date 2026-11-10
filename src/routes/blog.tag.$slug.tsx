import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {BlogListing,BlogMissing,BlogError} from '@/components/blog/BlogPages';
import {blogListQuery} from '@/lib/blog-public.queries';
import {blogListHead} from '@/lib/blog-public';
export const Route=createFileRoute('/blog/tag/$slug')({staticData:{sitemap:true},validateSearch:(v:Record<string,unknown>):{pagina?:number}=>({pagina:Math.max(1,Math.min(100000,Math.floor(Number(v['pagina'])||1)))}),loaderDeps:({search})=>({page:search.pagina??1}),loader:({context,params,deps})=>context.queryClient.ensureQueryData(blogListQuery(deps.page,'tag',params.slug)),head:({loaderData,params})=>blogListHead(`Tag: ${loaderData?.selected?.nome??'Blog'}`,`/blog/tag/${params.slug}`,loaderData?.page),errorComponent:BlogError,notFoundComponent:BlogMissing,component:Page});
function Page(){const {slug}=Route.useParams();const {pagina}=Route.useSearch();const {data}=useSuspenseQuery(blogListQuery(pagina??1,'tag',slug));return <BlogListing data={data} kind="tag" slug={slug}/>;}