import { createFileRoute } from '@tanstack/react-router';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { adminHead } from '@/components/admin/admin-shared';
export const Route=createFileRoute('/_authenticated/admin/blog/$id')({staticData:{sitemap:false},validateSearch:(search:Record<string,unknown>):{preview?:boolean}=>({preview:search['preview']===true||search['preview']==='true'}),head:()=>adminHead('Editar post','Edição e prévia privada de artigos do Compare e Compre.'),component:Post});
function Post(){const {id}=Route.useParams();return <BlogEditor key={id} id={id}/>;}
