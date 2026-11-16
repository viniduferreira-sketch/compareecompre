import { describe, expect, it } from 'vitest';
import { classifyPartnerCategory, refineSiteCategory } from './partner-category';
describe('partner category evidence', () => {
  it('does not classify Friopeças tools as electronic hardware', () => {
    expect(classifyPartnerCategory({store:'Friopeças',title:'Curvador de Tubo Minibend Rothenberger',category:'hardware',category_path:'hardware > industry production'})).toBeNull();
  });
  it('classifies Kennedy lighting as Casa, not electronics technology', () => {
    expect(classifyPartnerCategory({store:'Ferramentas Kennedy',title:'Lâmpada LED AR111',category:'electronics technology',category_path:'electronics technology > commerce retail > lighting'})).toBe('Casa');
  });
  it('does not mistake an electrical conduit for electronics', () => {
    expect(classifyPartnerCategory({store:'Ferramentas Kennedy',title:'Luva Eletroduto Roscável',category:'electronics technology'})).toBe('Casa');
  });
  it('retains genuine computer hardware in KaBuM', () => {
    expect(classifyPartnerCategory({store:'KaBuM',title:'Placa de Vídeo RTX 5060',category:'Hardware'})).toBe('Eletrônicos');
  });
  it('uses the specific category path before its broad parent', () => {
    expect(classifyPartnerCategory({title:'Luminária',category_path:'electronics technology > lighting'})).toBe('Casa');
  });
  it('does not ban genuine electronic devices from specialist stores', () => {
    expect(classifyPartnerCategory({store:'Friopeças',title:'Monitor Samsung 24',category:'electronics technology'})).toBe('Eletrônicos');
  });
  it('moves monitors, hotel TVs and notebooks out of Casa', () => {
    expect(classifyPartnerCategory({title:'Monitor LG FHD Home & Office 22U403A-B',category:'Monitors',category_path:'Home Accessories'})).toBe('Eletrônicos');
    expect(classifyPartnerCategory({title:'Hotel TV Pro:Centric - 55UM767H0SB',category:'Home Accessories'})).toBe('Eletrônicos');
    expect(refineSiteCategory('Notebook Lenovo IdeaPad Slim 3x','Casa')).toBe('Eletrônicos');
    expect(refineSiteCategory('Suporte Fixo para Tv LCD/Led','Casa')).toBe('Casa');
  });
  it('keeps Smart TVs out of Games', () => {
    expect(classifyPartnerCategory({title:'Smart TV 4K 86" LG QNED73 Portal de Games',category:'Televisions'})).toBe('Eletrônicos');
    expect(refineSiteCategory('Controle Gamer Bluetooth','Games')).toBe('Games');
  });
  it('keeps phone chargers and cables out of Celulares', () => {
    expect(refineSiteCategory('4 Em 1 Cabo Carregador USB Tipo-C Turbo 100W','Celulares')).toBe('Eletrônicos');
    expect(refineSiteCategory('Celular Samsung Galaxy A57 256gb com carregador','Celulares')).toBe('Celulares');
  });
  it('moves laces and sunglasses from Esportes to Moda', () => {
    expect(refineSiteCategory('Cadarço Elástico Lock Laces Tênis Corrida','Esportes')).toBe('Moda');
    expect(refineSiteCategory('Óculos Esportivo Mormaii Beach Tenis','Esportes')).toBe('Moda');
    expect(refineSiteCategory('Tênis Olympikus Proof 3','Esportes')).toBe('Esportes');
  });
});
