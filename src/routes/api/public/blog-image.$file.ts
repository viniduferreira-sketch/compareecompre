import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/public/blog-image/$file')({staticData:{sitemap:false},server:{handlers:{GET:async({params})=>{
 if(!/^[a-f0-9-]{36}\.webp$/.test(params.file)) return new Response('Not found',{status:404});
 // Only immutable WebP assets from this dedicated bucket are public. No private post data is returned.
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data,error}=await supabaseAdmin.storage.from('blog-images').download(params.file);
 if(error||!data)return new Response('Not found',{status:404});
 return new Response(data,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}}}});
