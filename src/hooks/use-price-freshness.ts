import { useEffect, useState } from 'react';
import { isFreshPrice, MAX_PRICE_AGE_MS } from '@/lib/offer-freshness';

export function usePriceFreshness(timestamp: string | null | undefined) {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useEffect(() => {
    setClock(Date.now());
    const time = timestamp ? Date.parse(timestamp) : NaN;
    if (!Number.isFinite(time)) return;
    const remaining = time + MAX_PRICE_AGE_MS - Date.now() + 1;
    if (remaining <= 0) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.min(remaining, 2147483647));
    return () => clearTimeout(timer);
  }, [timestamp]);
  return isFreshPrice(timestamp, clock);
}