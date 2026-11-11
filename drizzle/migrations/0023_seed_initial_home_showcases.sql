CREATE INDEX IF NOT EXISTS home_showcases_category ON public.home_showcases(category_slug);
INSERT INTO public.home_showcases(title,subtitle,category_slug,terms,sort_order,active)
SELECT title,subtitle,category_slug,terms,sort_order,true FROM (VALUES
('Monte o seu setup gamer pelo menor preço','Teclados, mouses, headsets e monitores de várias lojas, lado a lado.','games',ARRAY['teclado','mouse','headset','monitor'],1),
('Treine com estilo gastando menos','Tênis e roupas esportivas com os melhores preços.','esportes',ARRAY[]::text[],2),
('Menos trabalho na cozinha, mais tempo para você','Air fryers, liquidificadores e cafeteiras comparados em várias lojas.','casa',ARRAY['air fryer','liquidificador','cafeteira','batedeira'],3),
('Celulares com o melhor custo-benefício','Compare o preço do mesmo modelo em várias lojas.','celulares',ARRAY[]::text[],4)
) initial(title,subtitle,category_slug,terms,sort_order)
WHERE NOT EXISTS(SELECT 1 FROM public.home_showcases existing WHERE existing.category_slug=initial.category_slug);