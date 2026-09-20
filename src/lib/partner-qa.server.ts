export type PartnerQA = {
  pergunta: string;
  resposta?: string;
  data: string;
  source: string;
};

type MercadoLivreQuestion = {
  text?: string;
  date_created?: string;
  answer?: {
    text?: string;
    date_created?: string;
  } | null;
};

const MAX_QA_PER_OFFER = 8;

function isMercadoLivreItemId(itemId: string): boolean {
  return /^MLB\d+$/i.test(itemId);
}

export async function fetchQA_MercadoLivre(
  itemId: string,
  headers: HeadersInit,
  fetcher: (input: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<PartnerQA[]> {
  if (!isMercadoLivreItemId(itemId)) return [];

  const params = new URLSearchParams({ item: itemId, api_version: "4", limit: "50" });

  try {
    const response = await fetcher(`https://api.mercadolibre.com/questions/search?${params}`, { headers });
    if (!response.ok) {
      if (response.status !== 404) {
        console.warn("Mercado Livre Q&A unavailable", itemId, response.status);
      }
      return [];
    }

    const payload = (await response.json()) as { questions?: MercadoLivreQuestion[] };
    return (payload.questions ?? [])
      .flatMap((item): PartnerQA[] => {
        const pergunta = item.text?.trim();
        const data = item.date_created ?? item.answer?.date_created;
        if (!pergunta || !data) return [];

        const resposta = item.answer?.text?.trim();
        return [{
          pergunta,
          ...(resposta ? { resposta } : {}),
          data,
          source: "mercado_livre",
        }];
      })
      .sort((left, right) => Date.parse(right.data) - Date.parse(left.data))
      .slice(0, MAX_QA_PER_OFFER);
  } catch (error) {
    console.warn("Mercado Livre Q&A request failed", itemId, error);
    return [];
  }
}