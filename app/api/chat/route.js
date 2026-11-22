import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { getChatHistory, saveChatMessage } from '@/lib/db.js';
import { botReply } from '@/lib/bot.js';
import { crossOriginDenied } from '@/lib/security.js';

const MAX_MESSAGE = 1000;

// История переписки за последние 7 дней.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });
  const messages = getChatHistory(user.id);
  return NextResponse.json({ ok: true, messages });
}

// Отправка сообщения: сохраняем его и возвращаем ответ бота.
export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim().slice(0, MAX_MESSAGE);
  if (!message) return NextResponse.json({ ok: false, error: 'Пустое сообщение' }, { status: 400 });

  const firstName = user.name.split(/\s+/).pop();
  saveChatMessage(user.id, 'user', message, null, null);

  const reply = botReply(message, firstName);
  const saved = saveChatMessage(user.id, 'assistant', reply.text, reply.actionLabel || null, reply.actionHref || null);

  return NextResponse.json({ ok: true, reply: saved });
}
