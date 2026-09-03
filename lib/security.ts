import { env } from 'cloudflare:workers';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 120_000;

export const clientCookieName = 'vip_client_session';

export type ClientSession = {
  clientId: number;
  username: string;
  displayName: string;
  exp: number;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0)
    return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function sessionSecret() {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'development')
    return 'ventas-vip-development-secret-only';
  throw new Error('SESSION_SECRET is not configured');
}

async function derivePassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  return { salt: saltHex, hash: await derivePassword(password, saltHex) };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expected: string,
) {
  const actual = await derivePassword(password, salt);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createClientSession(input: Omit<ClientSession, 'exp'>) {
  const payload: ClientSession = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${await sign(encoded)}`;
}

export async function readClientSession(
  token: string | undefined,
): Promise<ClientSession | null> {
  if (!token) return null;
  const [payload, providedSignature, extra] = token.split('.');
  if (!payload || !providedSignature || extra) return null;
  const expectedSignature = await sign(payload);
  if (expectedSignature.length !== providedSignature.length) return null;
  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |=
      expectedSignature.charCodeAt(index) ^ providedSignature.charCodeAt(index);
  }
  if (difference !== 0) return null;
  try {
    const parsed = JSON.parse(
      decoder.decode(base64UrlDecode(payload)),
    ) as ClientSession;
    if (
      !Number.isInteger(parsed.clientId) ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function generateTemporaryPassword() {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}
