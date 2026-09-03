import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Headphones,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicPaymentMethods, getPublicProducts } from '@/lib/data';
import {
  formatMoney,
  supportNumberDisplay,
  whatsappUrl,
  type Accent,
} from '@/lib/site-data';
import { SiteTools } from './site-tools';

export const dynamic = 'force-dynamic';

const accentStyles: Record<Accent, string> = {
  gold: 'from-amber-300 via-orange-400 to-red-500',
  violet: 'from-fuchsia-400 via-violet-500 to-indigo-700',
  blue: 'from-cyan-300 via-sky-500 to-blue-800',
  emerald: 'from-lime-300 via-emerald-500 to-teal-800',
  rose: 'from-rose-300 via-pink-500 to-purple-800',
};

export default async function Home() {
  const [products, paymentMethods] = await Promise.all([
    getPublicProducts(),
    getPublicPaymentMethods(),
  ]);
  const support = whatsappUrl(
    'Hola, necesito asistencia con VENTAS VIP STREAMING.',
  );
  const recharge = whatsappUrl(
    'Hola, quiero recargar mi cuenta de VENTAS VIP STREAMING.',
  );

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteTools
        products={products.map((product) => ({
          name: product.name,
          price: formatMoney(product.priceCents, product.currency),
          available: product.stock > 0,
        }))}
      />

      <header className="relative z-40 border-b border-white/8 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
          <a
            className="group flex items-center gap-3"
            href="#inicio"
            aria-label="Ir al inicio"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-[0_0_30px_rgba(255,208,0,.25)] transition-transform group-hover:-rotate-6">
              V
            </span>
            <span className="leading-none">
              <strong className="block text-[1.05rem] tracking-[-0.02em]">
                VENTAS VIP
              </strong>
              <span className="text-xs font-bold tracking-[0.24em] text-primary">
                STREAMING
              </span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-zinc-300 md:flex"
            aria-label="Principal"
          >
            <a className="transition hover:text-white" href="#catalogo">
              Catálogo
            </a>
            <a className="transition hover:text-white" href="#recargar">
              Recargar
            </a>
            <Link className="transition hover:text-white" href="/acceso">
              Mi acceso
            </Link>
          </nav>

          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-primary-foreground transition hover:-translate-y-0.5 hover:bg-amber-300"
            href={support}
            target="_blank"
            rel="noreferrer"
          >
            <Headphones className="size-4" />
            <span className="hidden sm:inline">Soporte</span>
          </a>
        </div>
      </header>

      <section id="inicio" className="hero-grid relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(255,122,0,.18),transparent_28%),radial-gradient(circle_at_12%_80%,rgba(255,208,0,.08),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-amber-200">
              <Sparkles className="size-4" /> Accesos digitales en minutos
            </div>
            <h1 className="text-balance text-5xl font-black leading-[.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Tu entretenimiento,
              <span className="mt-2 block text-primary">en modo VIP.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-zinc-300">
              Elige tu plan, confirma disponibilidad y recibe acompañamiento
              directo antes y después de tu compra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-black text-primary-foreground transition hover:-translate-y-0.5 hover:bg-amber-300"
                href="#catalogo"
              >
                Ver catálogo <ArrowRight className="size-5" />
              </a>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 font-bold text-white transition hover:bg-white/10"
                href="/acceso"
              >
                Ya soy cliente
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-zinc-400">
              <span className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" /> Activación guiada
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Soporte directo
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card p-3 shadow-2xl shadow-black/50">
              <Image
                className="aspect-square w-full rounded-[1.4rem] object-cover"
                src="/assets/mascota-vip.png"
                alt="Mascota de Ventas VIP Streaming"
                width={512}
                height={512}
                priority
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/10 bg-black/75 p-4 backdrop-blur-xl">
                <p className="text-xs font-black tracking-[0.18em] text-primary">
                  ATENCIÓN VIP
                </p>
                <p className="mt-1 font-bold text-white">
                  Te ayudamos a elegir y activar tu plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-white/8 bg-white/[.025]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-white/8 px-5 sm:grid-cols-3 lg:px-8">
          {[
            [Zap, 'Respuesta rápida', 'Compra coordinada por WhatsApp'],
            [KeyRound, 'Acceso personal', 'Consulta tu vigencia y recargas'],
            [Headphones, 'Acompañamiento', 'Soporte en el mismo número'],
          ].map(([Icon, title, copy]) => (
            <div
              key={String(title)}
              className="flex gap-4 bg-background px-4 py-6 sm:px-6"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-bold text-white">{String(title)}</p>
                <p className="mt-1 text-sm text-zinc-500">{String(copy)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section id="catalogo" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-primary">
                DISPONIBLE AHORA
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Elige tu plan
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-400">
              El stock puede cambiar durante el día. Confirmamos cada pedido
              antes del pago.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const price = formatMoney(product.priceCents, product.currency);
              const purchase = whatsappUrl(
                `Hola, quiero comprar ${product.name} por ${price}. ¿Está disponible?`,
              );
              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-card p-3 transition hover:-translate-y-1 hover:border-primary/35"
                >
                  <div
                    className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${accentStyles[product.accent]} p-5 text-white`}
                  >
                    {product.imageUrl ? (
                      <Image
                        className="absolute inset-0 size-full object-cover"
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized
                      />
                    ) : (
                      <>
                        <span className="absolute -right-8 -top-10 size-32 rounded-full border-[18px] border-white/10" />
                        <span className="absolute -bottom-8 left-6 size-20 rounded-full bg-black/10 blur-sm" />
                      </>
                    )}
                    <span className="relative z-10 w-fit rounded-full bg-black/30 px-3 py-1 text-xs font-black tracking-[0.12em] backdrop-blur">
                      {product.badge}
                    </span>
                    <div className="relative z-10">
                      <div className="mb-2 h-px w-14 bg-white/70" />
                      <p className="text-2xl font-black tracking-[-0.04em] drop-shadow">
                        {product.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-3 pb-2 pt-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                      {product.category}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                      {product.description}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="size-4" /> {product.period}
                      </span>
                      <span
                        className={
                          product.stock > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }
                      >
                        {product.stock > 0
                          ? `${product.stock} disp.`
                          : 'Agotado'}
                      </span>
                    </div>
                    <div className="mt-5 border-t border-white/8 pt-4">
                      <p className="text-2xl font-black text-white">{price}</p>
                      <a
                        className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-black transition ${product.stock > 0 ? 'bg-primary text-primary-foreground hover:bg-amber-300' : 'pointer-events-none bg-white/8 text-zinc-600'}`}
                        href={product.stock > 0 ? purchase : '#'}
                        target={product.stock > 0 ? '_blank' : undefined}
                        rel="noreferrer"
                        aria-disabled={product.stock <= 0}
                      >
                        {product.stock > 0 ? 'Comprar por WhatsApp' : 'Agotado'}
                        {product.stock > 0 && (
                          <ChevronRight className="size-4" />
                        )}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="recargar"
        className="border-y border-white/8 bg-[#0b0b0b] py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-primary">
              RECARGAS Y PAGOS
            </p>
            <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Paga fácil. Nosotros validamos.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
              Escanea el QR o solicita otro método. Envía tu comprobante al
              mismo número de soporte para completar la activación.
            </p>
            <ol className="mt-7 space-y-4">
              {[
                'Elige el plan o monto de recarga.',
                'Realiza el pago con el método activo.',
                'Envía el comprobante por WhatsApp.',
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-4 text-sm font-semibold text-zinc-300"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-black text-primary">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 font-black text-black transition hover:-translate-y-0.5 hover:bg-[#4be27f]"
              href={recharge}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-5" /> Recargar por WhatsApp
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {paymentMethods.map((method) => (
              <article
                key={method.id}
                className="overflow-hidden rounded-3xl border border-white/8 bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/6 text-primary">
                    <WalletCards className="size-5" />
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-400">
                    {method.type}
                  </span>
                </div>
                {method.imageUrl ? (
                  <div className="mt-5 overflow-hidden rounded-2xl bg-white p-2">
                    <Image
                      className="aspect-[4/5] w-full object-cover object-top"
                      src={method.imageUrl}
                      alt={`Código de pago ${method.label}`}
                      width={800}
                      height={1000}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="mt-5 grid aspect-[4/5] place-items-center rounded-2xl border border-dashed border-white/12 bg-black/20 text-primary">
                    <CreditCard className="size-12" />
                  </div>
                )}
                <h3 className="mt-5 text-xl font-black">{method.label}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {method.instructions}
                </p>
                {method.recipient && (
                  <p className="mt-3 text-sm font-bold text-zinc-200">
                    Titular: {method.recipient}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="absolute -right-10 -top-24 size-64 rounded-full border-[42px] border-black/5" />
            <div className="relative max-w-2xl">
              <p className="text-sm font-black tracking-[0.16em]">
                ZONA DE CLIENTES
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Tu plan, tu vigencia y tus recargas en un solo lugar.
              </h2>
              <p className="mt-4 max-w-xl font-semibold opacity-75">
                Ingresa con el usuario y la contraseña que recibiste al comprar.
              </p>
            </div>
            <Link
              className="relative mt-7 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-black px-6 font-black text-white transition hover:-translate-y-0.5 lg:mt-0"
              href="/acceso"
            >
              Entrar a mi cuenta <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 pb-28 pt-10 sm:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 text-sm text-zinc-500 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <p className="font-black text-white">VENTAS VIP STREAMING</p>
            <a
              className="mt-2 block font-semibold text-primary hover:underline"
              href={support}
              target="_blank"
              rel="noreferrer"
            >
              {supportNumberDisplay}
            </a>
            <p className="mt-3 max-w-xl leading-6">
              Servicio independiente. La disponibilidad y las condiciones se
              confirman antes de cada pago. Las marcas de terceros pertenecen a
              sus respectivos titulares.
            </p>
          </div>
          <div className="flex gap-5 font-semibold">
            <Link className="hover:text-white" href="/acceso">
              Clientes
            </Link>
            <Link className="hover:text-white" href="/admin">
              Administrar
            </Link>
          </div>
        </div>
      </footer>

      <a
        className="fixed bottom-5 right-5 z-50 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#25d366] px-5 font-black text-black shadow-2xl shadow-black/50 transition hover:-translate-y-1"
        href={support}
        target="_blank"
        rel="noreferrer"
        aria-label={`Hablar por WhatsApp al ${supportNumberDisplay}`}
      >
        <MessageCircle className="size-5" />{' '}
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </main>
  );
}
