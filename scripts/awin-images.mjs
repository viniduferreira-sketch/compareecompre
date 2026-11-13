/** Ordered feed image candidates shared by normalization and workflow priority. */
export const AWIN_IMAGE_COLUMNS = ['aw_image_url', 'merchant_image_url', 'large_image', 'alternate_image', 'aw_thumb_url', 'merchant_thumb_url', 'alternate_image_two'];
export function awinImages(row) {
  return [...new Set(AWIN_IMAGE_COLUMNS.flatMap(column => {
    const value = row[column]?.trim();
    if (!value) return [];
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? [url.href] : [];
    } catch { return []; }
  }))];
}