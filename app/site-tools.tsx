'use client';

import { useEffect } from 'react';
import { supportNumber, whatsappUrl } from '@/lib/site-data';

type ToolProduct = { name: string; price: string; available: boolean };

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export function SiteTools({ products }: { products: ToolProduct[] }) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const report = () => undefined;
    void Promise.resolve(
      context.registerTool(
        {
          name: 'list_available_plans',
          title: 'Ver planes disponibles',
          description:
            'Devuelve los planes visibles actualmente en VENTAS VIP STREAMING.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: () => ({ plans: products }),
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'start_plan_purchase',
          title: 'Comprar un plan',
          description:
            'Abre WhatsApp con el plan seleccionado para confirmar disponibilidad y comprar.',
          inputSchema: {
            type: 'object',
            properties: {
              planName: {
                type: 'string',
                description: 'Nombre exacto del plan.',
              },
            },
            required: ['planName'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input) => {
            const planName =
              typeof input === 'object' && input && 'planName' in input
                ? String((input as { planName: unknown }).planName)
                : '';
            const plan = products.find(
              (item) => item.name === planName && item.available,
            );
            if (!plan) throw new Error('El plan indicado no está disponible.');
            const url = whatsappUrl(
              `Hola, quiero comprar ${plan.name} (${plan.price}) en VENTAS VIP STREAMING.`,
            );
            window.open(url, '_blank', 'noopener,noreferrer');
            return {
              status: 'whatsapp_opened',
              plan: plan.name,
              supportNumber,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);

    return () => lifecycle.abort();
  }, [products]);

  return null;
}
