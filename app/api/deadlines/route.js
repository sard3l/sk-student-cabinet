import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { addDeadline } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

const MAX_TITLE = 200;
const MAX_SUBJECT = 100;

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || '').trim().slice(0, MAX_TITLE);
  if (!title) {
    return NextResponse.json({ ok: false, error: 'Укажите название' }, { status: 400 });
  }

  const deadline = addDeadline(user.id, {
    title,
    subject: body.subject ? String(body.subject).slice(0, MAX_SUBJECT) : null,
    due: body.due ? String(body.due).slice(0, 20) : null,
    due_time: body.due_time ? String(body.due_time).slice(0, 10) : null,
  });
  return NextResponse.json({ ok: true, deadline });
}
