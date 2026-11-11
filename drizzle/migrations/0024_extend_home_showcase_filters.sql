ALTER TABLE public.home_showcases ADD COLUMN label text NOT NULL DEFAULT '', ADD COLUMN stores text[] NOT NULL DEFAULT '{}', ADD COLUMN min_price numeric, ADD COLUMN max_price numeric, ADD COLUMN store_quota integer;
ALTER TABLE public.home_showcases DROP CONSTRAINT home_showcases_category_slug_check;
ALTER TABLE public.home_showcases ADD CONSTRAINT home_showcases_category_slug_check CHECK(category_slug IN ('all','eletronicos','moda','casa','celulares','games','beleza','esportes'));
ALTER TABLE public.home_showcases ADD CONSTRAINT home_showcases_price_range CHECK(min_price IS NULL OR (min_price>=0 AND (max_price IS NULL OR max_price>=min_price)));
ALTER TABLE public.home_showcases ADD CONSTRAINT home_showcases_store_quota CHECK(store_quota IS NULL OR store_quota BETWEEN 1 AND 4);
UPDATE public.home_showcases SET label='SETUP GAMER',sort_order=1 WHERE id='68eaf592-1e70-4869-b709-efe8eab014ee';
UPDATE public.home_showcases SET label='CASA E COZINHA',sort_order=2 WHERE id='3f0cdf56-6fac-49ca-9c2e-00362d60499c';
UPDATE public.home_showcases SET label='ATÉ R$ 100',title='Achados até R$ 100',subtitle='Os produtos mais procurados que cabem no seu bolso, de várias lojas.',category_slug='all',min_price=20,max_price=100,terms='{}',sort_order=3 WHERE id='f2a8864e-d1e6-40db-98f7-68f11a52f9ed';
UPDATE public.home_showcases SET label='ESPORTE',title='Nike e Adidas: esporte com preço melhor',subtitle='Tênis e roupas das duas marcas lado a lado.',category_slug='all',stores=ARRAY['Nike BR','Adidas BR'],store_quota=4,sort_order=4 WHERE id='6de333a6-ec33-4a17-8ac5-290ab7a5aaeb';