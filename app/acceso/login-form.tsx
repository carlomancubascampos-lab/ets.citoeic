'use client';

import type { SyntheticEvent } from 'react';
import { useState } from 'react';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AccessState = 'idle' | 'loading' | 'success' | 'error';

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<AccessState>('idle');
  const [message, setMessage] = useState(
    'Escribe los datos que te entregamos al comprar.',
  );
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState('loading');
    setMessage('Comprobando tu acceso…');
    try {
      const response = await fetch('/api/client-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setState('error');
        setMessage(data.error ?? 'Usuario o contraseña incorrectos.');
        return;
      }
      setState('success');
      setMessage('¡Acceso correcto! Entrando a tu cuenta…');
      window.setTimeout(() => router.push('/mi-cuenta'), 750);
    } catch {
      setState('error');
      setMessage(
        'No pudimos conectar. Revisa tu internet e inténtalo otra vez.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <p className="text-sm font-black tracking-[0.16em] text-primary">
          ACCESO DE CLIENTES
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Bienvenido de vuelta
        </h2>
      </div>

      <div
        className={`skull-state skull-${state} relative mx-auto mt-7 grid size-32 place-items-center rounded-full border border-white/10 bg-white p-3`}
        aria-hidden="true"
      >
        {state === 'error' && (
          <span className="laugh-bubble absolute -right-6 -top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
            JA JA
          </span>
        )}
        <Image
          className="w-full"
          src="/assets/calavera-acceso.png"
          alt=""
          width={250}
          height={144}
        />
        {state === 'success' && (
          <span className="absolute -bottom-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">
            CORRECTO
          </span>
        )}
      </div>

      <p
        className={`mt-6 min-h-12 text-center text-sm leading-6 ${state === 'success' ? 'font-bold text-emerald-400' : state === 'error' ? 'font-bold text-red-400' : 'text-zinc-400'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>

      <form className="mt-3 space-y-5" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
            <Input
              id="username"
              name="username"
              autoComplete="username"
              minLength={4}
              required
              className="h-13 rounded-2xl border-white/10 bg-white/5 pl-12 text-base"
              placeholder="Tu usuario VIP"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              minLength={8}
              required
              className="h-13 rounded-2xl border-white/10 bg-white/5 px-12 text-base"
              placeholder="Tu contraseña"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={state === 'loading' || state === 'success'}
          className="h-13 w-full rounded-full bg-primary text-base font-black text-primary-foreground hover:bg-amber-300"
        >
          {state === 'loading' && (
            <LoaderCircle className="size-5 animate-spin" />
          )}
          {state === 'success'
            ? 'Acceso correcto'
            : state === 'loading'
              ? 'Validando…'
              : 'Ingresar a mi cuenta'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm leading-6 text-zinc-500">
        ¿Aún no tienes usuario? Se crea después de confirmar tu compra con
        soporte.
      </p>
    </div>
  );
}
