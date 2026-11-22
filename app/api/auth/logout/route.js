import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db.js';
import { SESSION_COOKIE } from '@/lib/session.js';
import { crossOriginDenied } from '@/lib/security.js';

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
