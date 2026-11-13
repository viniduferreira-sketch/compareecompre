import { queryOptions } from '@tanstack/react-query';
import { getBuyingGuide } from './product-buying.functions';
import { buyingTopic, selectTechnicalSimilars, technicalAttributes, type TechnicalHit } from './product-buying';
import { candidates, relatedCurrentQuery } from './related-products.queries';

export const buyingGuideQuery = (title: string) => queryOptions({
  queryKey: ['buying-guide', title], queryFn: () => getBuyingGuide({ data: { title } }), staleTime: 300000,
});
export const technicalSimilarsQuery = (id: string) => queryOptions({
  queryKey: ['technical-similars', id], staleTime: 300000,
  queryFn: async ({ client }) => {
    try {
      const current = await client.ensureQueryData(relatedCurrentQuery(id)) as TechnicalHit;
      const topic = buyingTopic(current.title);
      if (!topic || !technicalAttributes(current).length) return [];
      return selectTechnicalSimilars(current, await candidates(current, current.price * 0.7, current.price * 1.3, topic[1]) as TechnicalHit[]);
    } catch { return []; }
  },
});