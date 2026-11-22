import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { addGroupNotification } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  if (Number(user.is_starosta) !== 1) {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, 500);
  if (!text) return NextResponse.json({ ok: false, error: 'Пустое сообщение' }, { status: 400 });

  const count = addGroupNotification(user.group_name, text);
  return NextResponse.json({ ok: true, count });
}
