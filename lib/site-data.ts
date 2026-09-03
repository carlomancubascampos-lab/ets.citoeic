export type Accent = 'gold' | 'violet' | 'blue' | 'emerald' | 'rose';

export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  currency: string;
  period: string;
  badge: string;
  accent: Accent;
  imageUrl: string | null;
  stock: number;
  active: boolean;
  sortOrder: number;
};

export type PaymentMethod = {
  id: number;
  label: string;
  type: string;
  instructions: string;
  recipient: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

export const defaultProducts: Product[] = [
  {
    id: -1,
    name: 'Cine VIP',
    category: 'Películas',
    description: 'Un perfil personal con acompañamiento para la activación.',
    priceCents: 1490000,
    currency: 'COP',
    period: '30 días',
    badge: 'Más elegido',
    accent: 'gold',
    imageUrl: null,
    stock: 12,
    active: true,
    sortOrder: 1,
  },
  {
    id: -2,
    name: 'Series Max',
    category: 'Series',
    description: 'Acceso para maratones, estrenos y temporadas completas.',
    priceCents: 1290000,
    currency: 'COP',
    period: '30 días',
    badge: 'Nuevo',
    accent: 'violet',
    imageUrl: null,
    stock: 8,
    active: true,
    sortOrder: 2,
  },
  {
    id: -3,
    name: 'TV Premium',
    category: 'Canales en vivo',
    description: 'Entretenimiento en vivo con orientación de instalación.',
    priceCents: 1990000,
    currency: 'COP',
    period: '30 días',
    badge: 'Premium',
    accent: 'blue',
    imageUrl: null,
    stock: 6,
    active: true,
    sortOrder: 3,
  },
  {
    id: -4,
    name: 'Plan Familiar',
    category: 'Multiperfil',
    description: 'Una opción flexible para compartir entretenimiento en casa.',
    priceCents: 2490000,
    currency: 'COP',
    period: '30 días',
    badge: 'Familias',
    accent: 'emerald',
    imageUrl: null,
    stock: 5,
    active: true,
    sortOrder: 4,
  },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: -1,
    label: 'Yape',
    type: 'QR',
    instructions:
      'Escanea el QR y envía el comprobante por WhatsApp para validar tu recarga.',
    recipient: 'Anderson Cubas Melendez',
    imageUrl: '/assets/pago-yape.png',
    active: true,
    sortOrder: 1,
  },
  {
    id: -2,
    label: 'Pago coordinado',
    type: 'WhatsApp',
    instructions:
      'Escríbenos para confirmar el medio disponible y recibir instrucciones.',
    recipient: null,
    imageUrl: null,
    active: true,
    sortOrder: 2,
  },
];

export const supportNumberDisplay = '+57 319 733 9950';
export const supportNumber = '573197339950';

export function formatMoney(cents: number, currency = 'COP') {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${Math.round(cents / 100).toLocaleString('es-CO')} ${currency}`;
  }
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;
}

export function safeAccent(value: string): Accent {
  return ['gold', 'violet', 'blue', 'emerald', 'rose'].includes(value)
    ? (value as Accent)
    : 'gold';
}
