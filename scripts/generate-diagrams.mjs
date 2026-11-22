// Генерирует схемы для документа (PNG из SVG).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const GREEN = '#24533a';
const DARK = '#20382a';
const MUTED = '#68796e';
const TINT = '#f5f8f5';
const LINE = '#cfe0d5';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="${GREEN}"/>
    </marker>
  </defs>
  <style>
    text { font-family: Arial, 'Helvetica Neue', sans-serif; }
  </style>
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  ${body}
</svg>`;
}

function title(t, sub) {
  return `<text x="60" y="70" font-size="30" font-weight="700" fill="${DARK}">${esc(t)}</text>
  <text x="60" y="102" font-size="16" fill="${MUTED}">${esc(sub)}</text>`;
}

function box(x, y, w, h, t, sub) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="${GREEN}" stroke-width="2"/>
  <text x="${x + w / 2}" y="${y + h / 2 - 4}" text-anchor="middle" font-size="20" font-weight="700" fill="${DARK}">${esc(t)}</text>
  <text x="${x + w / 2}" y="${y + h / 2 + 22}" text-anchor="middle" font-size="14" fill="${MUTED}">${esc(sub)}</text>`;
}

function arrow(x1, y, x2) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${GREEN}" stroke-width="2.5" marker-end="url(#arr)"/>`;
}

// 1. Архитектура
const arch = svg(
  1200,
  560,
  `${title('Архитектура прототипа', 'Один сервер: контейнеры Docker, постоянный диск для базы и файлов')}
  ${box(60, 190, 220, 130, 'Браузер', 'студент · староста · сотрудник')}
  ${box(340, 190, 220, 130, 'Caddy', 'HTTPS · Let’s Encrypt')}
  ${box(620, 190, 240, 130, 'Next.js', 'страницы + API')}
  ${box(920, 190, 220, 130, 'SQLite', 'база и файлы в .data')}
  ${arrow(280, 255, 336)}
  ${arrow(560, 255, 616)}
  ${arrow(860, 255, 916)}
  <rect x="340" y="390" width="800" height="96" rx="16" fill="${TINT}" stroke="${LINE}" stroke-width="2"/>
  <text x="740" y="430" text-anchor="middle" font-size="17" font-weight="700" fill="${DARK}">Docker Compose: app + caddy</text>
  <text x="740" y="458" text-anchor="middle" font-size="14" fill="${MUTED}">volume app_data — база SQLite и загруженные файлы сохраняются между перезапусками</text>`
);
await sharp(Buffer.from(arch)).png().toFile(path.join(OUT, 'architecture.png'));

// 2. Роли
function roleCard(x, y, w, h, t, items) {
  const lines = items
    .map((it, i) => `<text x="${x + 24}" y="${y + 92 + i * 34}" font-size="15" fill="${DARK}">• ${esc(it)}</text>`)
    .join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="${GREEN}" stroke-width="2"/>
  <rect x="${x}" y="${y}" width="${w}" height="58" rx="18" fill="${GREEN}"/>
  <rect x="${x}" y="${y + 40}" width="${w}" height="18" fill="${GREEN}"/>
  <text x="${x + 24}" y="${y + 38}" font-size="20" font-weight="700" fill="#ffffff">${esc(t)}</text>
  ${lines}`;
}
const roles = svg(
  1200,
  540,
  `${title('Три роли — три кабинета', 'Один интерфейс, разные права и сценарии')}
  ${roleCard(60, 150, 340, 330, 'Студент', ['Расписание и дедлайны', 'Оценки и зачётная книжка', 'Заявки, справки, загрузка работ', 'Помощник по документам', 'Достижения и уведомления'])}
  ${roleCard(430, 150, 340, 330, 'Староста', ['Посещаемость 20 одногруппников', 'Отметки «был / не был»', 'Рассылка дедлайнов', 'Сообщение всей группе', 'Дедлайн — в календарь'])}
  ${roleCard(800, 150, 340, 330, 'Сотрудник', ['Заявки на справки и выписки', 'Статусы «В работе» / «Готово»', 'Загрузка готового PDF', 'Замена преподавателя', 'Отмена пары'])}`
);
await sharp(Buffer.from(roles)).png().toFile(path.join(OUT, 'roles.png'));

// 3. Безопасность
function pill(x, y, w, t, sub) {
  return `<rect x="${x}" y="${y}" width="${w}" height="96" rx="16" fill="${TINT}" stroke="${LINE}" stroke-width="2"/>
  <text x="${x + 22}" y="${y + 38}" font-size="17" font-weight="700" fill="${GREEN}">${esc(t)}</text>
  <text x="${x + 22}" y="${y + 66}" font-size="14" fill="${DARK}">${esc(sub)}</text>`;
}
const security = svg(
  1200,
  540,
  `${title('Вход, данные и защита — просто', 'Что происходит «под капотом» в двух словах')}
  ${pill(60, 140, 520, 'Пароль', 'scrypt + соль — в базе только отпечаток, не сам пароль')}
  ${pill(620, 140, 520, 'Сессия', 'случайный токен в httpOnly-cookie; в БД — только sha256')}
  ${pill(60, 260, 520, 'Данные', 'каждый запрос привязан к user.id — чужое не открыть')}
  ${pill(620, 260, 520, 'CSRF', 'проверка Origin на изменяющих запросах + SameSite')}
  ${pill(60, 380, 520, 'Заголовки', 'CSP, HSTS, X-Frame-Options, nosniff')}
  ${pill(620, 380, 520, 'Инфраструктура', 'non-root контейнер, fail2ban, автообновления, бэкапы')}`
);
await sharp(Buffer.from(security)).png().toFile(path.join(OUT, 'security.png'));

console.log('ok: architecture.png, roles.png, security.png');
