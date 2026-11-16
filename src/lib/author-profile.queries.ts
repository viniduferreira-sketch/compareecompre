import {queryOptions} from '@tanstack/react-query';
import {notFound} from '@tanstack/react-router';
import {getEduardoProfile,getEduardoArticles} from './author-profile.functions';
export const eduardoProfileQuery=()=>queryOptions({queryKey:['public-author','eduardo-ferreira'],queryFn:async()=>{const author=await getEduardoProfile();if(!author)throw notFound();return author;},staleTime:300000});
export const eduardoArticlesQuery=(page:number)=>queryOptions({queryKey:['public-author','eduardo-ferreira','articles',page],queryFn:()=>getEduardoArticles({data:{page}}),staleTime:30000});