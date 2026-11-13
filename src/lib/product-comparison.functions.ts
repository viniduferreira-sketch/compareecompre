import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { readComparedOffers } from './product-comparison.server';

export const getComparedOffers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ key: z.string().min(1).max(2000).regex(/^(gtin:\d{14}|model:\[.*\])$/) }).parse(data))
  .handler(async ({ data }) => readComparedOffers(data.key));