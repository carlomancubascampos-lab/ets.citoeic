import { env } from 'cloudflare:workers';
import {
  defaultPaymentMethods,
  defaultProducts,
  type PaymentMethod,
  type Product,
  safeAccent,
} from './site-data';

type ProductRow = {
  id: number;
  name: string;
  category: string;
  description: string;
  price_cents: number;
  currency: string;
  period: string;
  badge: string;
  accent: string;
  image_url: string | null;
  stock: number;
  active: number;
  sort_order: number;
};

type PaymentRow = {
  id: number;
  label: string;
  type: string;
  instructions: string;
  recipient: string | null;
  image_url: string | null;
  active: number;
  sort_order: number;
};

export async function getPublicProducts(): Promise<Product[]> {
  try {
    const [activeRows, countRows] = await env.DB.batch([
      env.DB.prepare(
        `SELECT id, name, category, description, price_cents, currency, period,
          badge, accent, image_url, stock, active, sort_order
         FROM products WHERE active = 1 ORDER BY sort_order ASC, id DESC`,
      ),
      env.DB.prepare('SELECT COUNT(*) AS total FROM products'),
    ]);
    const total = Number(
      (countRows.results[0] as { total?: number } | undefined)?.total ?? 0,
    );
    if (total === 0) return defaultProducts;
    return (activeRows.results as ProductRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      priceCents: row.price_cents,
      currency: row.currency,
      period: row.period,
      badge: row.badge,
      accent: safeAccent(row.accent),
      imageUrl: row.image_url,
      stock: row.stock,
      active: Boolean(row.active),
      sortOrder: row.sort_order,
    }));
  } catch {
    return process.env.NODE_ENV === 'development' ? defaultProducts : [];
  }
}

export async function getPublicPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const [activeRows, countRows] = await env.DB.batch([
      env.DB.prepare(
        `SELECT id, label, type, instructions, recipient, image_url, active, sort_order
         FROM payment_methods WHERE active = 1 ORDER BY sort_order ASC, id DESC`,
      ),
      env.DB.prepare('SELECT COUNT(*) AS total FROM payment_methods'),
    ]);
    const total = Number(
      (countRows.results[0] as { total?: number } | undefined)?.total ?? 0,
    );
    if (total === 0) return defaultPaymentMethods;
    return (activeRows.results as PaymentRow[]).map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      instructions: row.instructions,
      recipient: row.recipient,
      imageUrl: row.image_url,
      active: Boolean(row.active),
      sortOrder: row.sort_order,
    }));
  } catch {
    return process.env.NODE_ENV === 'development' ? defaultPaymentMethods : [];
  }
}
