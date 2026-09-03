import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { clientCookieName, readClientSession } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: 'Origen de solicitud no válido.' },
        { status: 403 },
      );
    }
    const session = await readClientSession(
      request.cookies.get(clientCookieName)?.value,
    );
    if (!session)
      return NextResponse.json(
        { error: 'Inicia sesión para recargar.' },
        { status: 401 },
      );
    const body = (await request.json()) as {
      amountCents?: unknown;
      method?: unknown;
      note?: unknown;
    };
    const amountCents = Number(body.amountCents);
    const method =
      typeof body.method === 'string' ? body.method.trim().slice(0, 60) : '';
    const note =
      typeof body.note === 'string' ? body.note.trim().slice(0, 180) : null;
    if (
      !Number.isInteger(amountCents) ||
      amountCents < 100_000 ||
      amountCents > 100_000_000 ||
      !method
    ) {
      return NextResponse.json(
        { error: 'Revisa el monto y el método de pago.' },
        { status: 400 },
      );
    }
    const result = await env.DB.prepare(
      `INSERT INTO recharges (client_id, amount_cents, method, note, status)
       SELECT id, ?, ?, ?, 'pending' FROM clients
       WHERE id = ? AND status = 'active'
       RETURNING id`,
    )
      .bind(amountCents, method, note, session.clientId)
      .first<{ id: number }>();
    if (!result) {
      return NextResponse.json(
        { error: 'Tu cuenta no está habilitada para recargar.' },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { id: result?.id, status: 'pending' },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'No fue posible registrar la recarga.' },
      { status: 500 },
    );
  }
}
