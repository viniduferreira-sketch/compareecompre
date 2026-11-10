import { createFileRoute } from '@tanstack/react-router';
import { BlogEntities } from '@/components/admin/BlogEntities';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/autores')({staticData:{sitemap:false},head:()=>adminHead('Blog — autores','Gestão de autores do Blog Compare e Compre.'),component:()=> <BlogEntities kind="autores"/>});
