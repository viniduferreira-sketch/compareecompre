import { createFileRoute } from '@tanstack/react-router';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/novo')({staticData:{sitemap:false},head:()=>adminHead('Adicionar post','Editor de novos artigos do Compare e Compre.'),component:()=> <BlogEditor/>});
