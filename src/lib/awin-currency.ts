export function normalizeAwinCurrency(value: string | undefined, merchantName?: string) {
  const currency = (value ?? '').trim().toUpperCase();
  const merchant = (merchantName ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  // LG BR labels its real-denominated prices USD; do not convert the amount.
  if (!currency || (merchant === 'LG BR' && currency === 'USD')) return 'BRL';
  return currency;
}

export type CurrencyDiagnostics = {
  counts: Record<string, number>;
  examples: { title: string; price: string; currency: string }[];
};

// Never include URLs, arbitrary columns or credentials in a diagnostic sample.
function safeCell(value: string | undefined) {
  return (value ?? '').replace(/https?:\/\/\S+/gi, '[link protegido]').replace(/[\u0000-\u001f]/g, ' ').slice(0, 200);
}

export function addCurrencyDiagnostic(result: CurrencyDiagnostics, row: Record<string, string>) {
  const currency = safeCell(row['currency']);
  const label = currency.trim() || 'vazio';
  result.counts[label] = (result.counts[label] ?? 0) + 1;
  if (result.examples.length < 3) result.examples.push({ title: safeCell(row['product_name']), price: safeCell(row['search_price']), currency });
}

export function mergeCurrencyDiagnostics(values: unknown[]): CurrencyDiagnostics | null {
  const result: CurrencyDiagnostics = { counts: {}, examples: [] };
  let found = false;
  for (const value of values) {
    if (!value || typeof value !== 'object' || !('currency_diagnostics' in value)) continue;
    const diagnostic = value.currency_diagnostics;
    if (!diagnostic || typeof diagnostic !== 'object' || !('counts' in diagnostic) || !('examples' in diagnostic)) continue;
    found = true;
    if (diagnostic.counts && typeof diagnostic.counts === 'object') {
      for (const [key, count] of Object.entries(diagnostic.counts)) {
        if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) result.counts[key] = (result.counts[key] ?? 0) + count;
      }
    }
    if (Array.isArray(diagnostic.examples)) {
      for (const example of diagnostic.examples) {
        if (result.examples.length >= 3) break;
        if (example && typeof example.title === 'string' && typeof example.price === 'string' && typeof example.currency === 'string') {
          result.examples.push({ title: safeCell(example.title), price: safeCell(example.price), currency: safeCell(example.currency) });
        }
      }
    }
  }
  return found ? result : null;
}