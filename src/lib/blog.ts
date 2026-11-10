import { z } from 'zod';
import { parse } from 'yaml';
import { marked } from 'marked';
export const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const imageUrl = z.string().max(2048).refine(v => !v || /^https:\/\//.test(v) || /^\/api\/public\/blog-image\/[a-f0-9-]+\.webp$/.test(v), 'Use uma URL HTTPS ou imagem enviada ao Blog.');
export const blogPostSchema = z.object({
 id: z.string().uuid().optional(), titulo: z.string().trim().min(1, 'Informe o título.').max(300), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.').max(200), resumo: z.string().max(3000), corpo: z.string().max(500000), titulo_seo: z.string().max(300), descricao_seo: z.string().max(1000), imagem_url: imageUrl, imagem_alt: z.string().max(500), imagem_credito: z.string().max(500), categoria_id: z.string().uuid().nullable(), autor_id: z.string().uuid().nullable(), status: z.enum(['rascunho','agendado','publicado']), publicado_em: z.string().datetime({offset:true}).nullable(), tags: z.array(z.string().uuid()).max(100)
}).superRefine((post, ctx) => {
 if (post.imagem_url && !post.imagem_alt.trim()) ctx.addIssue({code:'custom',path:['imagem_alt'],message:'Informe o texto alternativo da imagem.'});
 if (post.status === 'agendado' && (!post.publicado_em || Date.parse(post.publicado_em) <= Date.now())) ctx.addIssue({code:'custom',path:['publicado_em'],message:'Escolha uma data futura para agendar.'});
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export function seoChecks(post: { titulo_seo: string; descricao_seo: string; imagem_url: string; imagem_alt: string; categoria_id: string | null; autor_id?: string | null }) {
 return { 'Imagem destacada com texto alternativo': !!post.imagem_url && !!post.imagem_alt.trim(), 'Categoria definida': !!post.categoria_id, 'Título SEO (1–60 caracteres)': post.titulo_seo.trim().length > 0 && post.titulo_seo.length <= 60, 'Descrição SEO (1–160 caracteres)': post.descricao_seo.trim().length > 0 && post.descricao_seo.length <= 160 };
}
export function publicationChecklist(post: Parameters<typeof seoChecks>[0]) { return {...seoChecks(post), 'Autor definido': !!post.autor_id}; }
export function visiblePost(post: {status: string; publicado_em: string | null}, now = Date.now()) { return ['publicado','agendado'].includes(post.status) && !!post.publicado_em && Date.parse(post.publicado_em) <= now; }
export function parseArticle(text: string) {
 const match = text.replace(/^\uFEFF/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
 const raw: unknown = match ? parse(match[1] ?? '', {maxAliasCount: 0}) : {};
 const fields = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
 const str = (key: string) => typeof fields[key] === 'string' || typeof fields[key] === 'number' ? String(fields[key]) : '';
 const tags = Array.isArray(fields['tags']) ? fields['tags'].filter((v): v is string => typeof v === 'string') : str('tags').split(',');
 return { titulo: str('titulo'), slug: str('slug'), titulo_seo: str('titulo_seo'), descricao_seo: str('descricao_seo'), resumo: str('resumo'), categoria: str('categoria'), tags: tags.map(v => v.trim()).filter(Boolean), corpo: marked.parse(match ? match[2] ?? '' : text, {async:false}) };
}
export const emptyPost: BlogPostInput = {titulo:'',slug:'',resumo:'',corpo:'',titulo_seo:'',descricao_seo:'',imagem_url:'',imagem_alt:'',imagem_credito:'',categoria_id:null,autor_id:null,status:'rascunho',publicado_em:null,tags:[]};
