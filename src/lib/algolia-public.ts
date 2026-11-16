import { liteClient } from 'algoliasearch/lite';
import { createFetchRequester } from '@algolia/requester-fetch';

/** Public search only: Fetch works in browsers and the Worker SSR runtime. */
export function publicSearchClient(applicationId: string, apiKey: string) {
  return liteClient(applicationId, apiKey, { requester: createFetchRequester() });
}