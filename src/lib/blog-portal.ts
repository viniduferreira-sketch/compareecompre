export function prepareBlogReading(html: string) {
  const headings: {id: string; title: string}[] = [];
  let body = html.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner: string) => {
    const id = `secao-${headings.length + 1}`;
    const title = inner.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
    headings.push({id, title});
    return `<h2 id="${id}">${inner}</h2>`;
  });
  body = body.replace(/<table\b[\s\S]*?<\/table>/gi, table => `<div class="blog-table-scroll" tabindex="0" role="region" aria-label="Tabela do artigo">${table}</div>`);
  body = body.replace(/<img\b([^>]*?)\/?\s*>/gi, (_, attrs: string) => `<img${attrs} width="1200" height="675" loading="lazy">`);
  return {body, headings};
}

export function blogPageHref(path: string, page: number, query = '') {
  const params = new URLSearchParams();
  params.set('pagina', String(page));
  if (query) params.set('q', query);
  return `${path}?${params}`;
}