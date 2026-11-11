import { createFileRoute } from '@tanstack/react-router';
import { adminHead } from '@/components/admin/admin-shared';
import { HomeShowcaseEditor,adminShowcasesQuery } from '@/components/admin/HomeShowcaseEditor';
export const Route=createFileRoute('/_authenticated/admin/vitrines')({
  staticData:{sitemap:false},head:()=>adminHead('Vitrines da home','Gerencie as vitrines temáticas de produtos da página inicial.'),
  loader:({context})=>context.queryClient.ensureQueryData(adminShowcasesQuery),
  errorComponent:()=> <p role="alert">Não foi possível carregar as vitrines. <a href="/admin/vitrines" className="text-primary underline">Tentar novamente</a></p>,
  notFoundComponent:()=> <p>Página não encontrada.</p>,component:HomeShowcaseEditor,
});