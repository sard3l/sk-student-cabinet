import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { markNotificationsRead } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
