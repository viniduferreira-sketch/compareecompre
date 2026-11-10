import { supabase } from '@/integrations/supabase/client';
export async function uploadBlogImage(file: File) {
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Envie JPEG, PNG, WebP ou AVIF.');
 if(file.size>20*1024*1024)throw new Error('A imagem deve ter até 20 MB antes da conversão.');
 const bitmap=await createImageBitmap(file);
 const canvas=document.createElement('canvas');
 canvas.width=Math.min(1600,bitmap.width); canvas.height=Math.max(1,Math.round(bitmap.height*canvas.width/bitmap.width));
 const ctx=canvas.getContext('2d'); if(!ctx){bitmap.close();throw new Error('Não foi possível converter. Use uma URL da imagem.');}
 ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('Use uma URL da imagem.')),'image/webp',0.82));
 if(blob.type!=='image/webp')throw new Error('Conversão indisponível. Use uma URL da imagem.');
 const path=`${crypto.randomUUID()}.webp`;
 const result=await supabase.storage.from('blog-images').upload(path,blob,{contentType:'image/webp',upsert:false});
 if(result.error)throw new Error('Não foi possível enviar. Use uma URL da imagem.');
 return `/api/public/blog-image/${path}`;
}
