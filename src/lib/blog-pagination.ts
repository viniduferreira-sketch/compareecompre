type PageResult<T> = {data:T[]|null;count:number|null;error:{code?:string}|null};

export async function readBlogPage<T>(read:(start:number,end:number)=>PromiseLike<PageResult<T>>,start:number,end:number) {
 const result=await read(start,end);
 if(!result.error)return {rows:result.data??[],total:result.count??0};
 // PostgREST returns 416/PGRST103 for a valid page beyond the final row.
 // Read only the first row to recover the filtered count, never hide other errors.
 if(result.error.code==='PGRST103'){
  const first=await read(0,0);
  if(!first.error)return {rows:[] as T[],total:first.count??0};
 }
 throw new Error('Não foi possível carregar os artigos.');
}