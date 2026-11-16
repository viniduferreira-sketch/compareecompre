import { describe, expect, it } from 'vitest';
import { classifyPartnerCategory } from './partner-category';
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
});