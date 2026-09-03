import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import {
  clientCookieName,
  createClientSession,
  readClientSession,
  verifyPassword,
} from '@/lib/security';

type ClientRow = {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  phone: string | null;
  status: string;
  balance_cents: number;
  plan_name: string | null;
  valid_until: string | null;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
};

function publicClient(row: ClientRow) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    phone: row.phone,
    status: row.status,
    balanceCents: row.balance_cents,
    planName: row.plan_name,
    validUntil: row.valid_until,
    lastLoginAt: row.last_login_at,
  };
}

export async function GET(request: NextRequest) {
  const session = await readClientSession(
    request.cookies.get(clientCookieName)?.value,
  );
  if (!session)
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  const client = await env.DB.prepare(
    `SELECT id, username, password_hash, password_salt, display_name, phone, status,
      balance_cents, plan_name, valid_until, failed_attempts, locked_until, last_login_at
     FROM clients WHERE id = ?`,
  )
    .bind(session.clientId)
    .first<ClientRow>();
  if (!client || client.status !== 'active') {
    return NextResponse.json(
      { error: 'Cuenta no disponible.' },
      { status: 401 },
    );
  }
  const recharges = await env.DB.prepare(
    `SELECT id, amount_cents, method, note, status, created_at
     FROM recharges WHERE client_id = ? ORDER BY id DESC LIMIT 8`,
  )
    .bind(client.id)
    .all();
  return NextResponse.json({
    client: publicClient(client),
    recharges: recharges.results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: unknown;
      password?: unknown;
    };
    const username =
      typeof body.username === 'string'
        ? body.username.trim().toLowerCase()
        : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (username.length < 4 || password.length < 8) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    const client = await env.DB.prepare(
      `SELECT id, username, password_hash, password_salt, display_name, phone, status,
        balance_cents, plan_name, valid_until, failed_attempts, locked_until, last_login_at
       FROM clients WHERE username = ?`,
    )
      .bind(username)
      .first<ClientRow>();

    if (!client || client.status !== 'active') {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    if (
      client.locked_until &&
      new Date(client.locked_until).getTime() > Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
        },
        { status: 429 },
      );
    }

    const valid = await verifyPassword(
      password,
      client.password_salt,
      client.password_hash,
    );
    if (!valid) {
      await env.DB.prepare(
        `UPDATE clients
         SET failed_attempts = failed_attempts + 1,
             locked_until = CASE
               WHEN failed_attempts + 1 >= 5
               THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+15 minutes')
               ELSE locked_until
             END
         WHERE id = ?`,
      )
        .bind(client.id)
        .run();
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    await env.DB.prepare(
      'UPDATE clients SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .bind(client.id)
      .run();
    const token = await createClientSession({
      clientId: client.id,
      username: client.username,
      displayName: client.display_name,
    });
    const response = NextResponse.json({ client: publicClient(client) });
    response.cookies.set(clientCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: 'No fue posible validar el acceso. Intenta nuevamente.' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clientCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
