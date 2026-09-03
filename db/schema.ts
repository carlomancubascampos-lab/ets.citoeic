import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default('COP'),
    period: text('period').notNull().default('30 días'),
    badge: text('badge').notNull().default('Disponible'),
    accent: text('accent').notNull().default('gold'),
    imageUrl: text('image_url'),
    stock: integer('stock').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('products_name_unique').on(table.name),
    index('idx_products_active_sort').on(
      table.active,
      table.sortOrder,
      table.id,
    ),
  ],
);

export const clients = sqliteTable(
  'clients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    status: text('status').notNull().default('active'),
    balanceCents: integer('balance_cents').notNull().default(0),
    planName: text('plan_name'),
    validUntil: text('valid_until'),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: text('locked_until'),
    lastLoginAt: text('last_login_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex('clients_username_unique').on(table.username)],
);

export const paymentMethods = sqliteTable(
  'payment_methods',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    label: text('label').notNull(),
    type: text('type').notNull(),
    instructions: text('instructions').notNull(),
    recipient: text('recipient'),
    imageUrl: text('image_url'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_payment_methods_active_sort').on(
      table.active,
      table.sortOrder,
      table.id,
    ),
  ],
);

export const recharges = sqliteTable(
  'recharges',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id),
    amountCents: integer('amount_cents').notNull(),
    method: text('method').notNull(),
    note: text('note'),
    status: text('status').notNull().default('pending'),
    reviewedAt: text('reviewed_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_recharges_client_id').on(table.clientId, table.id)],
);
