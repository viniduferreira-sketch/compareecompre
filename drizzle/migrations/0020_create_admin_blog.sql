CREATE TABLE public.categorias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, slug text NOT NULL UNIQUE);
GRANT SELECT ON public.categorias TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.categorias TO authenticated; GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tags (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, slug text NOT NULL UNIQUE);
GRANT SELECT ON public.tags TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.tags TO authenticated; GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.autores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, foto_url text NOT NULL DEFAULT '', biografia text NOT NULL DEFAULT '');
GRANT SELECT ON public.autores TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.autores TO authenticated; GRANT ALL ON public.autores TO service_role;
ALTER TABLE public.autores ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo text NOT NULL DEFAULT '', slug text NOT NULL UNIQUE, resumo text NOT NULL DEFAULT '', corpo text NOT NULL DEFAULT '', titulo_seo text NOT NULL DEFAULT '', descricao_seo text NOT NULL DEFAULT '', imagem_url text NOT NULL DEFAULT '', imagem_alt text NOT NULL DEFAULT '', imagem_credito text NOT NULL DEFAULT '', categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL, autor_id uuid REFERENCES public.autores(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','agendado','publicado')), publicado_em timestamptz, visualizacoes bigint NOT NULL DEFAULT 0, criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.posts TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.posts TO authenticated; GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.post_tags (post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE, tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE, PRIMARY KEY(post_id,tag_id));
GRANT SELECT ON public.post_tags TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.post_tags TO authenticated; GRANT ALL ON public.post_tags TO service_role;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY blog_admin_categories ON public.categorias FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE POLICY blog_admin_tags ON public.tags FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE POLICY blog_admin_authors ON public.autores FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE POLICY blog_admin_posts ON public.posts FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE POLICY blog_admin_post_tags ON public.post_tags FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE POLICY blog_public_posts ON public.posts FOR SELECT TO anon,authenticated USING (status IN ('publicado','agendado') AND publicado_em <= now());
CREATE POLICY blog_public_categories ON public.categorias FOR SELECT TO anon,authenticated USING (EXISTS(SELECT 1 FROM public.posts WHERE categoria_id=categorias.id AND status IN ('publicado','agendado') AND publicado_em<=now()));
CREATE POLICY blog_public_authors ON public.autores FOR SELECT TO anon,authenticated USING (EXISTS(SELECT 1 FROM public.posts WHERE autor_id=autores.id AND status IN ('publicado','agendado') AND publicado_em<=now()));
CREATE POLICY blog_public_post_tags ON public.post_tags FOR SELECT TO anon,authenticated USING (EXISTS(SELECT 1 FROM public.posts WHERE id=post_tags.post_id AND status IN ('publicado','agendado') AND publicado_em<=now()));
CREATE POLICY blog_public_tags ON public.tags FOR SELECT TO anon,authenticated USING (EXISTS(SELECT 1 FROM public.post_tags WHERE tag_id=tags.id));
CREATE FUNCTION public.touch_blog_post() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.atualizado_em=now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_blog_post BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_blog_post();
CREATE FUNCTION public.save_blog_post(_post jsonb,_tags uuid[]) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE saved uuid; BEGIN
IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
INSERT INTO public.posts(id,titulo,slug,resumo,corpo,titulo_seo,descricao_seo,imagem_url,imagem_alt,imagem_credito,categoria_id,autor_id,status,publicado_em)
VALUES(COALESCE((_post->>'id')::uuid,gen_random_uuid()),_post->>'titulo',_post->>'slug',_post->>'resumo',_post->>'corpo',_post->>'titulo_seo',_post->>'descricao_seo',_post->>'imagem_url',_post->>'imagem_alt',_post->>'imagem_credito',NULLIF(_post->>'categoria_id','')::uuid,NULLIF(_post->>'autor_id','')::uuid,_post->>'status',NULLIF(_post->>'publicado_em','')::timestamptz)
ON CONFLICT(id) DO UPDATE SET titulo=EXCLUDED.titulo,slug=EXCLUDED.slug,resumo=EXCLUDED.resumo,corpo=EXCLUDED.corpo,titulo_seo=EXCLUDED.titulo_seo,descricao_seo=EXCLUDED.descricao_seo,imagem_url=EXCLUDED.imagem_url,imagem_alt=EXCLUDED.imagem_alt,imagem_credito=EXCLUDED.imagem_credito,categoria_id=EXCLUDED.categoria_id,autor_id=EXCLUDED.autor_id,status=EXCLUDED.status,publicado_em=EXCLUDED.publicado_em RETURNING id INTO saved;
DELETE FROM public.post_tags WHERE post_id=saved;
INSERT INTO public.post_tags(post_id,tag_id) SELECT saved,unnest(_tags);
RETURN saved; END; $$;
REVOKE ALL ON FUNCTION public.save_blog_post(jsonb,uuid[]) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.save_blog_post(jsonb,uuid[]) TO authenticated;
CREATE POLICY blog_images_admin ON storage.objects FOR ALL TO authenticated USING (bucket_id='blog-images' AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (bucket_id='blog-images' AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE INDEX blog_posts_publication ON public.posts(status,publicado_em);