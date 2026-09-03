'use client';

import type { SyntheticEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Headphones,
  LoaderCircle,
  LogOut,
  RefreshCw,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  formatMoney,
  supportNumberDisplay,
  whatsappUrl,
} from '@/lib/site-data';

type Customer = {
  id: number;
  username: string;
  displayName: string;
  phone: string | null;
  status: string;
  balanceCents: number;
  planName: string | null;
  validUntil: string | null;
  lastLoginAt: string | null;
};

type Recharge = {
  id: number;
  amount_cents: number;
  method: string;
  note: string | null;
  status: string;
  created_at: string;
};

export function CustomerDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeMessage, setRechargeMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/client-session', { cache: 'no-store' });
    if (!response.ok) {
      router.replace('/acceso');
      return;
    }
    const data = (await response.json()) as {
      client: Customer;
      recharges: Recharge[];
    };
    setCustomer(data.client);
    setRecharges(data.recharges);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function logout() {
    await fetch('/api/client-session', { method: 'DELETE' });
    router.replace('/acceso');
  }

  async function requestRecharge(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    const methodEntry = form.get('method');
    const method = typeof methodEntry === 'string' ? methodEntry : 'Yape';
    const response = await fetch('/api/recharges', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        amountCents: Math.round(amount * 100),
        method,
        note: form.get('note'),
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setRechargeMessage(
        data.error ?? 'No fue posible registrar la solicitud.',
      );
      return;
    }
    setRechargeMessage(
      'Solicitud registrada. Abriendo WhatsApp para enviar el comprobante…',
    );
    void load();
    window.open(
      whatsappUrl(
        `Hola, soy ${customer?.username}. Solicité una recarga de ${formatMoney(amount * 100)} por ${method}.`,
      ),
      '_blank',
      'noopener,noreferrer',
    );
  }

  if (loading || !customer) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-9 animate-spin text-primary" />
          <p className="mt-4 text-sm font-bold text-zinc-400">
            Cargando tu cuenta…
          </p>
        </div>
      </main>
    );
  }

  const validDate = customer.validUntil
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
        new Date(`${customer.validUntil}T12:00:00`),
      )
    : 'Por confirmar';
  const support = whatsappUrl(
    `Hola, soy ${customer.username} y necesito asistencia con mi cuenta VIP.`,
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/8 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
            href="/"
          >
            <ArrowLeft className="size-4" /> Tienda
          </Link>
          <div className="text-center">
            <p className="font-black">VENTAS VIP</p>
            <p className="text-xs font-black tracking-[0.18em] text-primary">
              MI CUENTA
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="text-zinc-400 hover:text-white"
          >
            <LogOut className="size-4" />{' '}
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary text-xl font-black text-primary-foreground">
              {customer.displayName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-bold text-zinc-500">Hola,</p>
              <h1 className="text-3xl font-black tracking-[-0.04em]">
                {customer.displayName}
              </h1>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-400">
            <CheckCircle2 className="size-4" /> Cuenta activa
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/8 bg-card p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black tracking-[0.14em] text-primary">
                PLAN ACTUAL
              </p>
              <CalendarDays className="size-5 text-zinc-600" />
            </div>
            <h2 className="mt-4 text-3xl font-black">
              {customer.planName ?? 'Sin plan asignado'}
            </h2>
            <p className="mt-2 text-zinc-400">
              Vigente hasta <strong className="text-white">{validDate}</strong>
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8">
              <span className="block h-full w-3/4 rounded-full bg-primary" />
            </div>
          </article>
          <article className="rounded-3xl border border-white/8 bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black tracking-[0.14em] text-primary">
                SALDO
              </p>
              <WalletCards className="size-5 text-zinc-600" />
            </div>
            <p className="mt-5 text-3xl font-black">
              {formatMoney(customer.balanceCents)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Disponible en tu cuenta
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <article className="rounded-3xl border border-white/8 bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black tracking-[0.14em] text-primary">
                  RECARGAS
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Movimientos recientes
                </h2>
              </div>
              <RefreshCw className="size-5 text-zinc-600" />
            </div>
            {recharges.length ? (
              <div className="mt-5 divide-y divide-white/8">
                {recharges.map((recharge) => (
                  <div
                    key={recharge.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="font-bold">
                        {formatMoney(recharge.amount_cents)}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {recharge.method} ·{' '}
                        {new Intl.DateTimeFormat('es-CO').format(
                          new Date(recharge.created_at),
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${recharge.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400' : recharge.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-300'}`}
                    >
                      {recharge.status === 'approved'
                        ? 'Aprobada'
                        : recharge.status === 'rejected'
                          ? 'Rechazada'
                          : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                Aún no tienes recargas registradas.
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <Dialog>
              <DialogTrigger
                render={
                  <Button className="h-auto min-h-28 w-full justify-between rounded-3xl bg-primary p-6 text-left text-primary-foreground hover:bg-amber-300" />
                }
              >
                <span>
                  <span className="block text-xs font-black tracking-[0.14em] opacity-70">
                    AGREGAR SALDO
                  </span>
                  <span className="mt-2 block text-2xl font-black">
                    Solicitar recarga
                  </span>
                </span>
                <WalletCards className="size-7" />
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-card text-white">
                <DialogHeader>
                  <DialogTitle>Solicitar recarga</DialogTitle>
                  <DialogDescription>
                    Registra el monto y luego envía tu comprobante por WhatsApp.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={requestRecharge}>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto en COP</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="1000"
                      step="1000"
                      required
                      className="bg-white/5"
                      placeholder="20000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Método</Label>
                    <Select name="method" defaultValue="Yape">
                      <SelectTrigger className="w-full bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yape">Yape</SelectItem>
                        <SelectItem value="Coordinado por WhatsApp">
                          Coordinado por WhatsApp
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Referencia opcional</Label>
                    <Textarea
                      id="note"
                      name="note"
                      className="bg-white/5"
                      placeholder="Número de operación o detalle"
                    />
                  </div>
                  {rechargeMessage && (
                    <p className="text-sm text-primary" aria-live="polite">
                      {rechargeMessage}
                    </p>
                  )}
                  <Button className="w-full bg-primary font-black text-primary-foreground hover:bg-amber-300">
                    Registrar y abrir WhatsApp
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <a
              className="flex min-h-28 items-center justify-between rounded-3xl border border-white/8 bg-card p-6 transition hover:border-[#25d366]/40"
              href={support}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <span className="block text-xs font-black tracking-[0.14em] text-[#25d366]">
                  ASISTENCIA
                </span>
                <span className="mt-2 block text-xl font-black">
                  {supportNumberDisplay}
                </span>
              </span>
              <Headphones className="size-7 text-[#25d366]" />
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}
