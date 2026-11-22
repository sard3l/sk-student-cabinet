import { NextResponse } from 'next/server';
import { getDb, createSession } from '@/lib/db.js';
import { hashPassword, verifyPassword } from '@/lib/auth.js';
import { rateLimit, clientIp, crossOriginDenied } from '@/lib/security.js';

// Хэш-заглушка выравнивает время ответа для несуществующих логинов
// (защита от определения существующих учёток по времени).
const DUMMY_HASH = hashPassword('dummy-password-for-timing');

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  // Не более 30 попыток входа за 5 минут с одного IP (защита от перебора).
  if (!rateLimit('login:' + clientIp(req), 30, 5 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: 'Слишком много попыток. Попробуйте позже.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const login = String(body.login || '').trim().toLowerCase().slice(0, 100);
  const password = String(body.password || '').slice(0, 200);

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);

  if (!user) {
    verifyPassword(password, DUMMY_HASH);
    return NextResponse.json({ ok: false, error: 'Неверный логин или пароль' }, { status: 401 });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ ok: false, error: 'Неверный логин или пароль' }, { status: 401 });
  }

  const { token } = createSession(user.id);
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set('sk_session', token, {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
