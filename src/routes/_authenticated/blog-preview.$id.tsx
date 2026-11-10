import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {BlogArticlePage,BlogMissing,BlogError} from '@/components/blog/BlogPages';
import {blogPreviewQuery} from '@/lib/blog-public.queries';
import {articleHead} from '@/lib/blog-public';
import {getBlogData} from '@/lib/blog.functions';
export const Route=createFileRoute('/_authenticated/blog-preview/$id')({staticData:{sitemap:false},loader:async({context,params})=>{await getBlogData({data:{}});return context.queryClient.ensureQueryData(blogPreviewQuery(params.id));},head:({loaderData})=>articleHead(loaderData?.post,true),errorComponent:BlogError,notFoundComponent:BlogMissing,component:Page});
function Page(){const {id}=Route.useParams();const {data}=useSuspenseQuery(blogPreviewQuery(id));return <BlogArticlePage {...data} preview/>;}