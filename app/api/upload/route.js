import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { createRequest } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_EXT = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_SIZE = 30 * 1024 * 1024; // 30 МБ
const MAX_BODY = MAX_SIZE + 2 * 1024 * 1024; // запас на multipart-обвязку
const MAX_TITLE = 200;
const MAX_SUBJECT = 100;

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  // Ранний отказ по размеру тела запроса (защита от переполнения памяти).
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'Файл слишком большой (максимум 30 МБ)' }, { status: 413 });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  const file = formData.get('file');
  const kind = String(formData.get('kind') || 'absence').slice(0, 40);
  const title = String(formData.get('title') || 'Документ').slice(0, MAX_TITLE);
  const subject = formData.get('subject') ? String(formData.get('subject')).slice(0, MAX_SUBJECT) : null;

  // серверная проверка: файл обязателен
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'Файл не загружен' }, { status: 400 });
  }

  // серверная проверка: формат
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ ok: false, error: 'Недопустимый формат файла' }, { status: 400 });
  }

  // серверная проверка: размер
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: 'Файл слишком большой (максимум 30 МБ)' }, { status: 400 });
  }

  // сохраняем файл на диск (безопасное имя без спецсимволов)
  const uploadDir = path.join(process.cwd(), '.data', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const safeName =
    crypto.randomBytes(8).toString('hex') + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, safeName), bytes);

  const request = createRequest(user.id, {
    kind,
    title,
    subject,
    file_name: safeName,
    file_size: file.size,
  });

  return NextResponse.json({ ok: true, request });
}
