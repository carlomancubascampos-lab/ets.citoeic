export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

const PRODUCT_IMAGE_KEY = /^products\/[0-9a-f-]+\.(?:jpg|png|webp|gif)$/i;

export function isProductImageKey(value: string): boolean {
  return PRODUCT_IMAGE_KEY.test(value);
}

export function productImageUrl(key: string): string {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

export function productImageKeyFromUrl(value: string | null): string | null {
  if (!value?.startsWith('/api/media?')) return null;

  try {
    const url = new URL(value, 'https://ventas-vip.invalid');
    const key = url.searchParams.get('key');
    return key && isProductImageKey(key) ? key : null;
  } catch {
    return null;
  }
}
