import { createFileRoute } from '@tanstack/react-router';
import { BlogList } from '@/components/admin/BlogList';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/')({staticData:{sitemap:false},head:()=>adminHead('Blog','Gestão privada de artigos do Compare e Compre.'),component:BlogList});
