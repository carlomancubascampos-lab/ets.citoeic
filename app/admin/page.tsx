import { ShieldAlert } from 'lucide-react';
import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { isConfiguredAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  const allowed =
    process.env.NODE_ENV === 'development' || isConfiguredAdmin(user.email);

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <div className="max-w-md rounded-3xl border border-red-400/20 bg-card p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-red-400" />
          <h1 className="mt-5 text-2xl font-black">Acceso restringido</h1>
          <p className="mt-3 leading-7 text-zinc-400">
            Esta cuenta no tiene permiso para administrar VENTAS VIP STREAMING.
          </p>
          <a
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-black text-black"
            href={chatGPTSignOutPath('/')}
          >
            Cerrar sesión
          </a>
        </div>
      </main>
    );
  }

  return <AdminDashboard adminName={user.displayName} />;
}
