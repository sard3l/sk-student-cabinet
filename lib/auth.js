import crypto from 'node:crypto';

// Хэширование пароля: scrypt + соль. Пароли нигде не хранятся в открытом виде.
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

// В БД храним только хэш токена: при утечке базы сессии нельзя переиспользовать.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
