import { createHmac, timingSafeEqual } from 'crypto';
import { JwtPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'first-principle-secret-key-change-in-prod';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);
  return Buffer.from(str, 'base64').toString();
}

export function createToken(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;

    const expectedSig = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload & { exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.userId, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  const hashBuffer = Buffer.from(hash);
  const computedBuffer = Buffer.from(computed);
  if (hashBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, computedBuffer);
}
