import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from '@/lib/admin';
import { defaultProducts } from '@/lib/site-data';
import { generateTemporaryPassword, hashPassword } from '@/lib/security';

type JsonRecord = Record<string, unknown>;

function textValue(value: unknown, label: string, min = 1, max = 180) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result.length < min || result.length > max) {
    throw new Error(`${label} debe tener entre ${min} y ${max} caracteres.`);
  }
  return result;
}

function optionalText(value: unknown, max = 240) {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().slice(0, max);
}

function integerValue(
  value: unknown,
  label: string,
  min = 0,
  max = 100_000_000,
) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) {
    throw new Error(`${label} no es válido.`);
  }
  return result;
}

function safeImageUrl(value: unknown) {
  const candidate = optionalText(value, 500);
  if (!candidate) return null;
  if (candidate.startsWith('/assets/')) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function optionalDate(value: unknown) {
  const candidate = optionalText(value, 10);
  if (!candidate) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new Error('La fecha de vigencia no es válida.');
  }
  const parsed = new Date(`${candidate}T12:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== candidate
  ) {
    throw new Error('La fecha de vigencia no es válida.');
  }
  return candidate;
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function unauthorized(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return null;
}

export async function GET() {
  try {
    await requireAdmin();
    const [products, clients, payments, recharges] = await env.DB.batch([
      env.DB.prepare(
        `SELECT id, name, category, description, price_cents, currency, period, badge,
          accent, image_url, stock, active, sort_order, created_at
         FROM products ORDER BY sort_order ASC, id DESC`,
      ),
      env.DB.prepare(
        `SELECT id, username, display_name, phone, status, balance_cents, plan_name,
          valid_until, last_login_at, created_at
         FROM clients ORDER BY id DESC`,
      ),
      env.DB.prepare(
        `SELECT id, label, type, instructions, recipient, image_url, active, sort_order, created_at
         FROM payment_methods ORDER BY sort_order ASC, id DESC`,
      ),
      env.DB.prepare(
        `SELECT r.id, r.amount_cents, r.method, r.note, r.status, r.created_at,
          r.reviewed_at, c.username, c.display_name
         FROM recharges r JOIN clients c ON c.id = r.client_id
         ORDER BY r.id DESC`,
      ),
    ]);

    return NextResponse.json({
      products: products.results,
      clients: clients.results,
      paymentMethods: payments.results,
      recharges: recharges.results,
    });
  } catch (error) {
    const authResponse = unauthorized(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: 'No fue posible cargar el panel. Intenta nuevamente.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Origen de solicitud no válido.' },
        { status: 403 },
      );
    }
    await requireAdmin();
    const body = (await request.json()) as JsonRecord;
    const action = textValue(body.action, 'Acción', 2, 40);

    if (action === 'createClient') {
      const username = textValue(body.username, 'Usuario', 4, 32).toLowerCase();
      if (!/^[a-z0-9._-]+$/.test(username)) {
        throw new Error(
          'El usuario solo admite letras, números, punto, guion y guion bajo.',
        );
      }
      const suppliedPassword = optionalText(body.password, 80);
      const temporaryPassword = suppliedPassword ?? generateTemporaryPassword();
      if (temporaryPassword.length < 8)
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      const { hash, salt } = await hashPassword(temporaryPassword);
      const displayName = textValue(body.displayName, 'Nombre', 2, 80);
      const phone = optionalText(body.phone, 30);
      const planName = optionalText(body.planName, 100);
      const validUntil = optionalDate(body.validUntil);
      const balanceCents = integerValue(body.balanceCents ?? 0, 'Saldo');

      const result = await env.DB.prepare(
        `INSERT INTO clients
          (username, password_hash, password_salt, display_name, phone, status,
           balance_cents, plan_name, valid_until)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
         RETURNING id`,
      )
        .bind(
          username,
          hash,
          salt,
          displayName,
          phone,
          balanceCents,
          planName,
          validUntil,
        )
        .first<{ id: number }>();

      return NextResponse.json(
        { id: result?.id, username, temporaryPassword },
        { status: 201 },
      );
    }

    if (action === 'createProduct') {
      const name = textValue(body.name, 'Nombre', 2, 100);
      const category = textValue(body.category, 'Categoría', 2, 60);
      const description = textValue(body.description, 'Descripción', 8, 240);
      const priceCents = integerValue(body.priceCents, 'Precio', 0);
      const currency = textValue(
        body.currency ?? 'COP',
        'Moneda',
        3,
        3,
      ).toUpperCase();
      if (!['COP', 'PEN', 'USD'].includes(currency)) {
        throw new Error('La moneda debe ser COP, PEN o USD.');
      }
      const period = textValue(body.period ?? '30 días', 'Duración', 2, 40);
      const badge = textValue(body.badge ?? 'Disponible', 'Etiqueta', 2, 40);
      const accent = ['gold', 'violet', 'blue', 'emerald', 'rose'].includes(
        String(body.accent),
      )
        ? String(body.accent)
        : 'gold';
      const imageUrl = safeImageUrl(body.imageUrl);
      const stock = integerValue(body.stock ?? 0, 'Stock', 0, 100_000);
      const sortOrder = integerValue(body.sortOrder ?? 0, 'Orden', 0, 10_000);

      const result = await env.DB.prepare(
        `INSERT INTO products
          (name, category, description, price_cents, currency, period, badge,
           accent, image_url, stock, active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         RETURNING id`,
      )
        .bind(
          name,
          category,
          description,
          priceCents,
          currency,
          period,
          badge,
          accent,
          imageUrl,
          stock,
          sortOrder,
        )
        .first<{ id: number }>();
      return NextResponse.json({ id: result?.id }, { status: 201 });
    }

    if (action === 'createPaymentMethod') {
      const label = textValue(body.label, 'Nombre', 2, 80);
      const type = textValue(body.type, 'Tipo', 2, 40);
      const instructions = textValue(
        body.instructions,
        'Instrucciones',
        8,
        240,
      );
      const recipient = optionalText(body.recipient, 100);
      const imageUrl = safeImageUrl(body.imageUrl);
      const sortOrder = integerValue(body.sortOrder ?? 0, 'Orden', 0, 10_000);
      const result = await env.DB.prepare(
        `INSERT INTO payment_methods
          (label, type, instructions, recipient, image_url, active, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, ?) RETURNING id`,
      )
        .bind(label, type, instructions, recipient, imageUrl, sortOrder)
        .first<{ id: number }>();
      return NextResponse.json({ id: result?.id }, { status: 201 });
    }

    if (action === 'toggleProduct') {
      const id = integerValue(body.id, 'Plan', 1);
      const active = body.active ? 1 : 0;
      await env.DB.prepare('UPDATE products SET active = ? WHERE id = ?')
        .bind(active, id)
        .run();
      return NextResponse.json({ ok: true });
    }

    if (action === 'updateRecharge') {
      const id = integerValue(body.id, 'Recarga', 1);
      const status = String(body.status);
      if (!['approved', 'rejected'].includes(status))
        throw new Error('Estado de recarga no válido.');
      if (status === 'approved') {
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE clients
             SET balance_cents = balance_cents + COALESCE(
               (SELECT amount_cents FROM recharges WHERE id = ? AND status = 'pending'), 0
             )
             WHERE id = (
               SELECT client_id FROM recharges WHERE id = ? AND status = 'pending'
             )`,
          ).bind(id, id),
          env.DB.prepare(
            `UPDATE recharges SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'pending'`,
          ).bind(id),
        ]);
      } else {
        await env.DB.prepare(
          `UPDATE recharges SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'pending'`,
        )
          .bind(id)
          .run();
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'seedCatalog') {
      const statements = defaultProducts.map((product) =>
        env.DB.prepare(
          `INSERT INTO products
            (name, category, description, price_cents, currency, period, badge,
             accent, image_url, stock, active, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
           ON CONFLICT(name) DO NOTHING`,
        ).bind(
          product.name,
          product.category,
          product.description,
          product.priceCents,
          product.currency,
          product.period,
          product.badge,
          product.accent,
          product.imageUrl,
          product.stock,
          product.sortOrder,
        ),
      );
      await env.DB.batch(statements);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: 'Acción no reconocida.' },
      { status: 400 },
    );
  } catch (error) {
    const authResponse = unauthorized(error);
    if (authResponse) return authResponse;
    const message =
      error instanceof Error ? error.message : 'Solicitud no válida.';
    const conflict = /unique|constraint/i.test(message);
    return NextResponse.json(
      { error: conflict ? 'Ese usuario o nombre ya existe.' : message },
      { status: conflict ? 409 : 400 },
    );
  }
}
