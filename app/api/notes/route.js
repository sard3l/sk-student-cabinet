import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { addNote, deleteNote } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';

const MAX_TEXT = 500;

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim().slice(0, MAX_TEXT);
  if (!text) return NextResponse.json({ ok: false, error: 'Пустой текст' }, { status: 400 });

  const note = addNote(user.id, text);
  return NextResponse.json({ ok: true, note });
}

export async function DELETE(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: 'Некорректный id' }, { status: 400 });
  }

  deleteNote(user.id, id);
  return NextResponse.json({ ok: true });
}
