import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { createRequest, updateRequestStatus } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

const MAX_TITLE = 200;
const MAX_SUBJECT = 100;
const ALLOWED_STATUS = [
  'На рассмотрении',
  'Принята',
  'В работе',
  'Готово',
  'Нужно исправить',
  'Отклонена',
  'Готово к выдаче',
  'Выполнено',
  'Проверена',
];

// Создание заявки (студент)
export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const request = createRequest(user.id, {
    kind: String(body.kind || 'order').slice(0, 40),
    title: String(body.title || 'Заявка').slice(0, MAX_TITLE),
    subject: body.subject ? String(body.subject).slice(0, MAX_SUBJECT) : null,
  });
  return NextResponse.json({ ok: true, request });
}

// Смена статуса заявки (только сотрудник)
export async function PATCH(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  if (user.role !== 'staff') {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: 'Некорректный id' }, { status: 400 });
  }
  if (!ALLOWED_STATUS.includes(body.status)) {
    return NextResponse.json({ ok: false, error: 'Недопустимый статус' }, { status: 400 });
  }

  const request = updateRequestStatus(id, body.status, body.comment || null);
  return NextResponse.json({ ok: true, request });
}
