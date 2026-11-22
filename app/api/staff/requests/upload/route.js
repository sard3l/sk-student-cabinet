import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { getRequestById, setRequestResult } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];
const MAX_SIZE = 20 * 1024 * 1024; // 20 МБ

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  if (user.role !== 'staff') {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });

  const id = Number(form.get('requestId'));
  const file = form.get('file');
  if (!Number.isInteger(id) || id <= 0 || !file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'Не указана заявка или файл' }, { status: 400 });
  }

  const request = getRequestById(id);
  if (!request) return NextResponse.json({ ok: false, error: 'Заявка не найдена' }, { status: 404 });

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ ok: false, error: 'Разрешены PDF, JPG, PNG' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: 'Файл слишком большой (максимум 20 МБ)' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), '.data', 'results');
  fs.mkdirSync(dir, { recursive: true });
  const safe = crypto.randomBytes(8).toString('hex') + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  fs.writeFileSync(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));

  const updated = setRequestResult(id, safe);
  return NextResponse.json({ ok: true, request: updated });
}
