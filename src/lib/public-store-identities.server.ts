// Existing registry is admin-only; expose only the approved display-enabled identity projection.
export async function readPublicStoreIdentities(){
 const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
 const rows: Array<{merchant_name:string;name:string;logo_url:string|null;description:string|null}>=[];
 for(let offset=0;;offset+=500){
  const result=await db.from('partner_stores').select('merchant_name,name,logo_url,description').eq('display_enabled',true).order('id').range(offset,offset+499);
  if(result.error)throw new Error('Não foi possível ler as lojas públicas.');
  rows.push(...result.data??[]);if((result.data?.length??0)<500)break;
 }
 return Object.fromEntries(rows.map(row=>[row.merchant_name,{name:row.name,logo_url:row.logo_url,description:row.description}]));
}