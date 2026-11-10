import { createFileRoute } from '@tanstack/react-router';
import { BlogEntities } from '@/components/admin/BlogEntities';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/categorias')({staticData:{sitemap:false},head:()=>adminHead('Blog — categorias','Gestão de categorias do Blog Compare e Compre.'),component:()=> <BlogEntities kind="categorias"/>});
