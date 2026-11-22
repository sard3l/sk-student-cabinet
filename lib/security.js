import { NextResponse } from 'next/server';

// Простые защиты: ограничение частоты запросов (в памяти) и проверка Origin (CSRF).

const buckets = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  }
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// Запрос с изменением состояния должен приходить с того же хоста.
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser клиенты Origin не шлют — их прикрывает сессия
  const host = req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Возвращает готовый 403-ответ, если Origin чужой, иначе null.
export function crossOriginDenied(req) {
  if (sameOrigin(req)) return null;
  return NextResponse.json({ ok: false, error: 'Запрос отклонён' }, { status: 403 });
}
