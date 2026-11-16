import { decodeHTML } from 'entities';
import { toSiteCategory, type SiteCategory } from './storefront-mix';

type CategoryInput = {
  title?: string | null; store?: string | null; source?: string;
  category?: string | null; categoryName?: string | null;
  merchant_category?: string | null; category_name?: string | null;
  product_type?: string | null; category_path?: string | null; merchant_category_path?: string | null;
};
const normalize = (value: string) => decodeHTML(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_/g, ' ');
const homeGoods = /\b(lamp(?:ada)?s?|luminarias?|arandelas?|pendentes?|refletor(?:es)?|painel led|chuveiros?|torneiras?|resistencia acqua|tomadas?|interruptor(?:es)?|disjuntor(?:es)?|soquetes?|eletrodutos?|cabinho|conector conico|placa (?:de \d postos|em termoplastico)|modulo pulsador|plugue|caixa acoplada)\b/;
const electronics = /\b(notebooks?|computador(?:es)?|monitor(?:es)?|tablets?|smartphones?|televisor(?:es)?|smart tv|fones? de ouvido|headsets?|roteador(?:es)?|placas? de video|ssd|memoria ram|cameras? (?:digital|de seguranca))\b/;

/** Specific taxonomy wins over broad labels such as hardware/electronics technology.
 * Specialist merchants are not banned: actual electronic devices remain eligible.
 */
export function classifyPartnerCategory(input: CategoryInput): SiteCategory | null {
  return refineSiteCategory(input.title, baseCategory(input));
}

const devices = /\b(notebooks?|computador(?:es)?|monitor(?:es)?|tablets?|smartphones?|celular(?:es)?|iphone|televisor(?:es)?|smart tv|tvs?)\b/;
const deviceAccessory = /^(suporte|mesa|rack|painel|capa|capinha|pelicula|base|cabo|controle remoto)\b/;
const phoneAccessory = /\b(cabos?|carregador(?:es)?|peliculas?|capas?|capinhas?|fontes?|adaptador(?:es)?|suportes?|power ?banks?|baterias? externas?)\b/;
const phoneDevice = /^(celular|smartphone|iphone|telefone celular)\b|\b(smartphone|celular) (?:samsung|motorola|xiaomi|apple|realme|lg|nokia|asus|poco|redmi|oppo|honor|tcl)\b/;

/** Final title check per site category, applied to every partner: keeps each category to its own product kind. */
export function refineSiteCategory(rawTitle: string | null | undefined, category: SiteCategory | null): SiteCategory | null {
  const title = normalize(rawTitle ?? '').trim();
  if (!title || !category) return category;
  if (category === 'Casa' && devices.test(title) && !deviceAccessory.test(title)) return /\b(smartphones?|celular(?:es)?|iphone)\b/.test(title) ? 'Celulares' : 'Eletrônicos';
  if (category === 'Games' && /\b(smart tv|tvs?|televisor(?:es)?)\b/.test(title)) return 'Eletrônicos';
  if (category === 'Celulares' && phoneAccessory.test(title) && !phoneDevice.test(title)) return 'Eletrônicos';
  if (category === 'Esportes' && /\b(cadarcos?|oculos)\b/.test(title) && !/\b(natacao|mergulho|ciclismo|bike)\b/.test(title)) return 'Moda';
  return category;
}

function baseCategory(input: CategoryInput): SiteCategory | null {
  const title = normalize(input.title ?? '');
  const store = normalize(input.store ?? '');
  const paths = [input.product_type, input.merchant_category_path, input.category_path, input.merchant_category, input.category_name, input.category].filter((v): v is string => Boolean(v));
  const specialist = /\b(ferramentas kennedy|friopecas)\b/.test(store);
  const industrial = paths.some(path => /\b(tools?|ferramentas?|industry production|refrigeration parts|pecas de refrigeracao)\b/.test(normalize(path)));
  if (electronics.test(title)) return toSiteCategory(title) ?? 'Eletrônicos';
  if (homeGoods.test(title)) return 'Casa';
  if (specialist || industrial) {
    // No matching site category is better than falsely calling a tool electronics.
    return null;
  }
  for (const path of paths) {
    for (const segment of path.split(/\s*[>|/]\s*/).reverse()) {
      const category = toSiteCategory(segment);
      if (category) return category;
    }
  }
  return toSiteCategory(input.categoryName);
}