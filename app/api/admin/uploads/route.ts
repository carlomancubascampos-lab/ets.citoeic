import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from '@/lib/admin';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
  productImageUrl,
} from '@/lib/media';
import { isSameOriginRequest } from '@/lib/request-security';

function authErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { error: 'Origen de solicitud no válido.' },
        { status: 403 },
      );
    }

    await requireAdmin();

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_PRODUCT_IMAGE_BYTES + 128 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no puede superar 5 MB.' },
        { status: 413 },
      );
    }

    const form = await request.formData();
    const uploaded = form.get('file');
    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        { error: 'Selecciona una imagen desde tu dispositivo.' },
        { status: 400 },
      );
    }

    const contentType = uploaded.type.toLowerCase();
    const extension =
      PRODUCT_IMAGE_TYPES[contentType as keyof typeof PRODUCT_IMAGE_TYPES];
    if (!extension) {
      return NextResponse.json(
        { error: 'Usa una imagen JPG, PNG, WEBP o GIF.' },
        { status: 415 },
      );
    }
    if (uploaded.size <= 0 || uploaded.size > MAX_PRODUCT_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen debe pesar entre 1 byte y 5 MB.' },
        { status: 413 },
      );
    }

    const key = `products/${crypto.randomUUID()}.${extension}`;
    await env.ASSETS.put(key, await uploaded.arrayBuffer(), {
      httpMetadata: { contentType },
    });

    return NextResponse.json(
      { key, url: productImageUrl(key) },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: 'No fue posible subir la imagen. Intenta nuevamente.' },
      { status: 500 },
    );
  }
}
