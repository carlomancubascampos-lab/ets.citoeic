import { env } from 'cloudflare:workers';
import { NextRequest } from 'next/server';
import { isProductImageKey } from '@/lib/media';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key || !isProductImageKey(key)) {
    return new Response('Imagen no válida.', { status: 400 });
  }

  const image = await env.ASSETS.get(key);
  if (!image) return new Response('Imagen no encontrada.', { status: 404 });

  const headers = new Headers();
  image.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', image.httpEtag);
  headers.set('x-content-type-options', 'nosniff');

  return new Response(image.body, { headers });
}
