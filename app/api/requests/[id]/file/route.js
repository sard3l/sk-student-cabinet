import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { getRequestById } from '@/lib/db.js';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export async function GET(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const request = getRequestById(Number(id));
  if (!request || !request.result_file) {
    return NextResponse.json({ ok: false, error: 'Файл не найден' }, { status: 404 });
  }

  // Доступ: владелец заявки или сотрудник.
  const isOwner = request.user_id === user.id;
  const isStaff = user.role === 'staff';
  if (!isOwner && !isStaff) {
    return NextResponse.json({ ok: false, error: 'Нет доступа' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), '.data', 'results', path.basename(request.result_file));
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: 'Файл не найден' }, { status: 404 });
  }

  const ext = (request.result_file.split('.').pop() || 'pdf').toLowerCase();
  const data = fs.readFileSync(filePath);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="document-${request.id}.${ext}"`,
      'Cache-Control': 'no-store',
    },
  });
}
