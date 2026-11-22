// Общие константы и генераторы учебного периода (сентябрь–декабрь 2026).

export const TERM_START = '2026-09-01';
export const TERM_END = '2026-12-19';

export const DOW_LABELS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// Текущая дата (реальное время сервера) в формате YYYY-MM-DD.
export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// «22 ноября 2026» из ISO-даты.
export function formatDateRu(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_RU[m - 1]} ${y}`;
}

// «21 ноября 2026» из даты вида «21.11.2026».
export function formatNewsDate(dmy) {
  if (!dmy) return '';
  const parts = String(dmy).split('.');
  if (parts.length !== 3) return dmy;
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  const y = Number(parts[2]);
  if (!m || !MONTHS_RU[m - 1]) return dmy;
  return `${d} ${MONTHS_RU[m - 1]} ${y}`;
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Все учебные дни (пн–сб) в диапазоне, без воскресений.
export function semesterDates(fromISO, endISO) {
  const out = [];
  const d = new Date(fromISO + 'T00:00:00');
  const last = new Date(endISO + 'T00:00:00');
  while (d <= last) {
    const dow = d.getDay(); // 0=вс
    if (dow !== 0) {
      const date = toISO(d);
      out.push({ date, dow, label: date.slice(8) + '.' + date.slice(5, 7), dowLabel: DOW_LABELS[dow] });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const TERM_DATES = semesterDates(TERM_START, TERM_END);

// Неделя (пн–сб), содержащая дату. Возвращает массив из 6 дат.
export function weekAround(anchorISO) {
  const a = new Date(anchorISO + 'T00:00:00');
  const dow = a.getDay(); // 0=вс
  const shift = dow === 0 ? -6 : 1 - dow; // до понедельника
  const mon = new Date(a);
  mon.setDate(a.getDate() + shift);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toISO(d);
  });
}

export function isoWeek(d) {
  const t = new Date(d + 'T00:00:00');
  const y = t.getFullYear();
  const m = t.getMonth() + 1;
  const day = t.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
