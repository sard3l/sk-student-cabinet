import { STUDY_DOCS } from './study-docs.js';

// Поиск ответа в типовых учебных документах (без LLM).
// Возвращает { text, actionLabel, actionHref } либо null.

const STOP = new Set([
  'что','как','где','когда','кто','почему','зачем','мне','меня','можно','нужно','надо','ли','не','ни',
  'и','а','но','или','же','бы','по','на','в','во','с','со','к','ко','о','об','от','до','за','из','у',
  'для','при','про','это','этот','эта','эти','тот','то','так','там','тут','если','чтобы','быть','есть',
  'я','ты','он','она','оно','мы','вы','они','мой','твой','свой','все','весь','уже','еще','очень','расскажи',
  'подскажи','скажи','объясни','пожалуйста','хочу','знать','получить','какой','какая','какие','сколько',
]);

// Группы синонимов: если слово из группы встретилось — ищем все варианты.
const SYNONYM_GROUPS = [
  ['пересдач', 'пересдать', 'пересдачи', 'долг', 'задолженность'],
  ['сессия', 'сессии', 'экзамен', 'экзамены', 'зачет', 'зачеты', 'аттестация'],
  ['пропуск', 'пропуски', 'пропустил', 'пропустила', 'отсутствие'],
  ['расписание', 'расписания', 'пара', 'пары', 'занятие', 'занятия'],
  ['стипендия', 'стипендии', 'стипендию'],
  ['вкр', 'диплом', 'дипломная', 'выпускная', 'квалификационная'],
  ['курсовая', 'курсовой', 'курсовую', 'курсовые'],
  ['антиплагиат', 'плагиат', 'оригинальность', 'уникальность'],
  ['дедлайн', 'дедлайны', 'срок', 'сроки', 'сдать', 'сдача'],
  ['каникулы', 'каникул', 'отдых'],
  ['практика', 'практику', 'практике'],
  ['справка', 'справку', 'справки'],
  ['апелляция', 'апелляцию', 'обжаловать', 'жалоба'],
  ['поведение', 'курить', 'алкоголь', 'пиротехника'],
  ['права', 'обязанности', 'обязан'],
  ['оценка', 'оценки', 'баллы', 'балл'],
];

function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s) {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function sameStem(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 4) return false;
  const k = Math.min(5, n);
  return a.slice(0, k) === b.slice(0, k);
}

function expand(tokens) {
  const out = new Set(tokens);
  for (const group of SYNONYM_GROUPS) {
    const hit = group.some((g) => tokens.some((t) => sameStem(t, g)));
    if (hit) for (const g of group) out.add(g);
  }
  return [...out];
}

function scoreSection(doc, sec, terms) {
  const heading = normalize(sec.heading);
  const body = normalize(`${doc.title} ${doc.summary} ${sec.text}`);
  let score = 0;
  for (const term of terms) {
    if (heading.includes(term)) score += 3;
    else if (body.includes(term)) score += 1;
  }
  return score;
}

function bestExcerpt(sec, terms) {
  const sentences = sec.text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return sec.text;
  let bestIdx = 0;
  let bestHits = -1;
  sentences.forEach((s, i) => {
    const n = normalize(s);
    const hits = terms.reduce((acc, t) => acc + (n.includes(t) ? 1 : 0), 0);
    if (hits > bestHits) {
      bestHits = hits;
      bestIdx = i;
    }
  });
  // 1–2 предложения для контекста.
  return sentences.slice(bestIdx, bestIdx + 2).join(' ');
}

export function docAnswer(question) {
  const base = tokenize(question);
  if (base.length === 0) return null;
  const terms = expand(base);

  let best = null;
  for (const doc of STUDY_DOCS) {
    for (const sec of doc.sections) {
      const score = scoreSection(doc, sec, terms);
      if (!best || score > best.score) best = { doc, sec, score };
    }
  }

  if (!best || best.score < 2) return null;

  const quote = bestExcerpt(best.sec, terms);
  const text =
    quote +
    '\n\nИсточник: «' +
    best.doc.title +
    '», раздел «' +
    best.sec.heading +
    '».';

  return {
    text,
    actionLabel: 'Открыть документ ↗',
    actionHref: '/documents?doc=' + best.doc.slug,
  };
}
