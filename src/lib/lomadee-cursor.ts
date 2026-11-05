export type LomadeeCursor = {
  merchantId?: string | undefined;
  products: Record<string, { page: number; offset: number }>;
  couponPage: number;
};

export function readLomadeeCursor(value: unknown): LomadeeCursor {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { products: {}, couponPage: 1 };
  const raw = value as Partial<LomadeeCursor>;
  const products: LomadeeCursor["products"] = {};
  if (raw.products && typeof raw.products === "object") for (const [id, position] of Object.entries(raw.products)) {
    if (position && Number.isInteger(position.page) && position.page > 0 && Number.isInteger(position.offset) && position.offset >= 0) products[id] = position;
  }
  return { merchantId: typeof raw.merchantId === "string" ? raw.merchantId : undefined, products,
    couponPage: Number.isInteger(raw.couponPage) && Number(raw.couponPage) > 0 ? Number(raw.couponPage) : 1 };
}

export function prioritizedMerchants<T extends { id: string; name: string }>(merchants: T[]) {
  return [...merchants].sort((a, b) => (Number(/shopee/i.test(b.name)) - Number(/shopee/i.test(a.name))) || a.id.localeCompare(b.id));
}