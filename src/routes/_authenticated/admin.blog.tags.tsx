import { createFileRoute } from '@tanstack/react-router';
import { BlogEntities } from '@/components/admin/BlogEntities';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/tags')({staticData:{sitemap:false},head:()=>adminHead('Blog — tags','Gestão de tags do Blog Compare e Compre.'),component:()=> <BlogEntities kind="tags"/>});
