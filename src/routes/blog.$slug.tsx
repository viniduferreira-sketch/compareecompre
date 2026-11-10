import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {BlogArticlePage,BlogMissing,BlogError} from '@/components/blog/BlogPages';
import {blogArticleQuery} from '@/lib/blog-public.queries';
import {articleHead} from '@/lib/blog-public';
export const Route=createFileRoute('/blog/$slug')({staticData:{sitemap:true},loader:({context,params})=>context.queryClient.ensureQueryData(blogArticleQuery(params.slug)),head:({loaderData})=>articleHead(loaderData?.post),errorComponent:BlogError,notFoundComponent:BlogMissing,component:Page});
function Page(){const {slug}=Route.useParams();const {data}=useSuspenseQuery(blogArticleQuery(slug));return <BlogArticlePage {...data}/>;}