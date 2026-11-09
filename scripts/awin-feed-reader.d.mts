export const FEED_TEST_MAX_BYTES: number;
export const FEED_TEST_MAX_ROWS: number;
export const FEED_TEST_TIMEOUT_MS: number;
export function validateFeedUrl(value: string): string;
export function maskFeedUrl(value: string): string;
export function parseCsv(stream: ReadableStream<string>): AsyncGenerator<Record<string,string>>;
export function openFeed(url: string, options?: { limited?: boolean }): Promise<ReadableStream<string>>;
