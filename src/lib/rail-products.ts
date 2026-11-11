export const normalizeRailText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function validProductImage(value?: string | null) {
  if (!value || /placeholder|no[-_]?image|sem[-_]?foto/i.test(value)) return false;
  return /^https?:\/\/[^\s]+$/i.test(value) || /^\/(?!\/)[^\s]+$/.test(value);
}
function titleTokens(title: string) {
  return normalizeRailText(title).replace(/\b(?:cor|tamanho|tam|preto|preta|branco|branca|azul|verde|vermelho|vermelha|rosa|cinza|bege|marrom|amarelo|amarela|roxo|roxa|creme|sortido|sortida|pp|p|m|g|gg|xxl|xl|xs|[3-4][0-9])\b/g,' ').split(/[^a-z0-9]+/).filter(Boolean);
}
export function sameRailProduct(a: {title:string;imageUrl?:string|null},b: {title:string;imageUrl?:string|null}) {
  const image=(url?:string|null)=>url?.replace(/^http:/,'https:').split('?')[0];
  if(a.imageUrl && image(a.imageUrl)===image(b.imageUrl))return true;
  const left=new Set(titleTokens(a.title)),right=new Set(titleTokens(b.title));
  const shared=[...left].filter(token=>right.has(token)).length;
  return shared/Math.max(left.size,right.size,1)>=0.85;
}