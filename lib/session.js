import { cookies } from 'next/headers';
import { getUserByToken } from './db.js';

export const SESSION_COOKIE = 'sk_session';

// Возвращает текущего пользователя по httpOnly-сессии, либо null.
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getUserByToken(token || null);
}
