import { describe, expect, it } from 'vitest';
import { blogArticleCta } from './blog-cta';

describe('Destino do botão de comparação do artigo', () => {
  it('leva celular à categoria Celulares', () => {
    expect(blogArticleCta('Como escolher um celular com bom custo-benefício?')).toEqual({ href: '/categoria/celulares', label: 'Comparar preços de celulares' });
  });
  it('leva console à categoria Games', () => {
    expect(blogArticleCta('Como escolher um console?')).toEqual({ href: '/categoria/games', label: 'Comparar preços de games' });
  });
  it('leva PC gamer à categoria Games', () => {
    expect(blogArticleCta('Como montar um PC gamer')).toEqual({ href: '/categoria/games', label: 'Comparar preços de games' });
  });
  it('leva desconto real às ofertas', () => {
    expect(blogArticleCta('Como saber se o desconto é real?')).toEqual({ href: '/ofertas', label: 'Comparar ofertas e descontos' });
  });
  it('leva loja confiável às lojas monitoradas', () => {
    expect(blogArticleCta('Como saber se a loja é confiável')).toEqual({ href: '/lojas-monitoradas', label: 'Comparar preços em lojas confiáveis' });
  });
  it('leva notebook à busca correspondente', () => {
    expect(blogArticleCta('Como escolher um notebook')).toEqual({ href: '/busca?q=notebook', label: 'Comparar preços de notebooks' });
  });
  it('leva TV à busca por smart TV', () => {
    expect(blogArticleCta('Como escolher uma smart TV')).toEqual({ href: '/busca?q=smart+tv', label: 'Comparar preços de smart TVs' });
  });
  it('leva fone à busca por fone Bluetooth', () => {
    expect(blogArticleCta('Como escolher um fone de ouvido')).toEqual({ href: '/busca?q=fone+bluetooth', label: 'Comparar preços de fones Bluetooth' });
  });
  it('leva air fryer à busca correspondente', () => {
    expect(blogArticleCta('Como escolher uma air fryer')).toEqual({ href: '/busca?q=air+fryer', label: 'Comparar preços de air fryers' });
  });
  it('leva tênis de corrida à busca sem acento', () => {
    expect(blogArticleCta('Como escolher um tênis de corrida')).toEqual({ href: '/busca?q=tenis+de+corrida', label: 'Comparar preços de tênis de corrida' });
  });
  it('leva protetor solar à busca correspondente', () => {
    expect(blogArticleCta('Como escolher um protetor solar')).toEqual({ href: '/busca?q=protetor+solar', label: 'Comparar preços de protetores solares' });
  });
});
