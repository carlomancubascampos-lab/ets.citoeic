import { env } from 'cloudflare:workers';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';

export class AdminAuthError extends Error {
  constructor(public status: 401 | 403) {
    super(
      status === 401
        ? 'Debes iniciar sesión.'
        : 'No tienes permisos de administración.',
    );
  }
}

export async function requireAdmin(): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) throw new AdminAuthError(401);
  if (process.env.NODE_ENV === 'development') return user;
  if (!isConfiguredAdmin(user.email))
    throw new AdminAuthError(403);
  return user;
}

export function isConfiguredAdmin(email: string): boolean {
  const configuredEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(configuredEmail && email.trim().toLowerCase() === configuredEmail);
}
