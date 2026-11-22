import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { getAttendance, saveAttendance } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

function isStarosta(user) {
  return user && Number(user.is_starosta) === 1;
}

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  if (!isStarosta(user)) {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  const url = new URL(req.url);
  const date = (url.searchParams.get('date') || '').slice(0, 10);
  const discipline = (url.searchParams.get('discipline') || '').slice(0, 200);
  if (!date) return NextResponse.json({ ok: false, error: 'Не указана дата' }, { status: 400 });

  const marks = getAttendance(user.group_name, date, discipline);
  return NextResponse.json({ ok: true, marks });
}

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  if (!isStarosta(user)) {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const date = String(body.date || '').slice(0, 10);
  const discipline = String(body.discipline || '').slice(0, 200);
  const marks = Array.isArray(body.marks) ? body.marks : [];
  if (!date || marks.length === 0) {
    return NextResponse.json({ ok: false, error: 'Некорректные данные' }, { status: 400 });
  }

  const clean = marks
    .filter((m) => Number.isInteger(Number(m.memberId)))
    .slice(0, 100)
    .map((m) => ({ memberId: Number(m.memberId), present: !!m.present }));

  saveAttendance(user.group_name, date, discipline, clean);
  return NextResponse.json({ ok: true });
}
