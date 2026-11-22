import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { addGroupDeadline } from '@/lib/db.js';
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
  const title = String(body.title || '').trim().slice(0, 200);
  const due = String(body.due || '').slice(0, 20);
  const due_time = String(body.due_time || '').slice(0, 10);
  if (!title || !due) {
    return NextResponse.json({ ok: false, error: 'Укажите название и дату' }, { status: 400 });
  }

  const count = addGroupDeadline(user.group_name, { title, due, due_time });
  return NextResponse.json({ ok: true, count });
}
