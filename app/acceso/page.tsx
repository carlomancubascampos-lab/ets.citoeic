import type { Metadata } from 'next';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { supportNumberDisplay, whatsappUrl } from '@/lib/site-data';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Acceso de clientes | VENTAS VIP STREAMING',
  description: 'Consulta tu plan, vigencia y recargas.',
};

export default function AccessPage() {
  const support = whatsappUrl(
    'Hola, necesito ayuda para ingresar a mi cuenta VIP.',
  );
  return (
    <main className="hero-grid relative grid min-h-screen place-items-center overflow-hidden px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,208,0,.12),transparent_30%),radial-gradient(circle_at_88%_80%,rgba(255,122,0,.13),transparent_28%)]" />
      <Link
        className="absolute left-5 top-5 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 text-sm font-bold text-zinc-300 backdrop-blur hover:text-white"
        href="/"
      >
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]/95 shadow-2xl shadow-black/60 lg:grid-cols-[.9fr_1.1fr]">
        <div className="hidden min-h-[660px] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="grid size-12 place-items-center rounded-2xl bg-black text-xl font-black text-white">
              V
            </div>
            <p className="mt-7 text-sm font-black tracking-[0.16em]">
              ZONA VIP
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[.96] tracking-[-0.055em]">
              Todo tu entretenimiento, bajo control.
            </h1>
          </div>
          <div className="rounded-3xl bg-black/10 p-6">
            <p className="font-black">¿Necesitas asistencia?</p>
            <p className="mt-2 text-sm font-semibold opacity-75">
              Escríbenos al {supportNumberDisplay}.
            </p>
            <a
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-black text-white"
              href={support}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" /> Hablar por WhatsApp
            </a>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
