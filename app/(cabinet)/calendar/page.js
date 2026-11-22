import { getScheduleBetween, getDeadlines } from '@/lib/db.js';
import { getCurrentUser } from '@/lib/session.js';
import { redirect } from 'next/navigation';
import { todayISO, weekAround, DOW_LABELS } from '@/lib/term.js';
import DeadlineModal from '@/components/DeadlineModal.jsx';

const DOW_FULL = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const TYPE_CLASS = {
  Лекция: 'event--lecture',
  Семинар: 'event--seminar',
  Практика: 'event--lecture',
};

function timeToTop(t) {
  const [h, m] = t.split(':').map(Number);
  return (h - 8) * 58 + (m / 60) * 58;
}

function fmtTime(t) {
  return String(t || '').replace(/^0/, '');
}

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function isoToParts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function shiftISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default async function CalendarPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const today = todayISO();
  const anchor = sp.week || today;
  const week = weekAround(anchor); // 6 дат пн–сб
  const schedule = getScheduleBetween(user.id, week[0], week[5]);
  const deadlines = getDeadlines(user.id);

  const byDate = {};
  for (const s of schedule) {
    (byDate[s.date] = byDate[s.date] || []).push(s);
  }

  const prevWeek = shiftISO(week[0], -7);
  const nextWeek = shiftISO(week[0], 7);

  const a = isoToParts(week[0]);
  const b = isoToParts(week[5]);
  const title =
    a.m === b.m
      ? `${a.d}–${b.d} ${MONTHS[a.m - 1]} ${a.y}`
      : `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Календарь</h1>
      </div>

      <div className="calendar-layout">
        <div className="week-scroll">
          <section className="week-widget">
            <div className="week-toolbar">
              <h2 className="week-toolbar__title">{title}</h2>
              <div className="week-nav">
                <a className="week-arrow" href={`/calendar?week=${prevWeek}`} aria-label="Предыдущая неделя">
                  ‹
                </a>
                <a className="week-arrow" href={`/calendar?week=${nextWeek}`} aria-label="Следующая неделя">
                  ›
                </a>
                <a className="week-today" href="/calendar">
                  Сегодня
                </a>
              </div>
            </div>

            <div className="week">
              <div className="week__head">
                <div className="week__head-corner" />
                {week.map((date) => {
                  const p = isoToParts(date);
                  const isToday = date === today;
                  return (
                    <div key={date} className={'week__head-day' + (isToday ? ' week__head-day--today' : '')}>
                      <span className="dow">{DOW_FULL[new Date(date + 'T00:00:00').getDay() - 1]}</span>
                      <span className="dnum">{p.d}</span>
                      {isToday && <span className="today-label">сегодня</span>}
                    </div>
                  );
                })}
              </div>

              <div className="week__body">
                <div className="week__grid">
                  <div className="week__gutter">
                    {HOURS.map((h, i) => (
                      <span key={h} style={{ top: 4 + i * 58 }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {week.map((date) => (
                    <div className="week__col" key={date}>
                      {(byDate[date] || []).map((s) => (
                        <div
                          key={s.id}
                          className={'event ' + (TYPE_CLASS[s.type] || 'event--lecture') + (s.cancelled ? ' event--cancelled' : '')}
                          style={{ top: timeToTop(s.time_start) }}
                        >
                          <div className="event__time">
                            {fmtTime(s.time_start)}–{fmtTime(s.time_end)}
                            {s.cancelled ? ' · Отменено' : ''}
                          </div>
                          <div className="event__title">{s.discipline}</div>
                          <div className="event__meta">
                            {s.type} · {s.room}
                          </div>
                          <div className="event__teacher">{s.teacher}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="week-legend">
              <span className="tz">Время московское · GMT+3</span>
              <span className="legend-item">
                <i className="legend-swatch legend-swatch--pairs" />
                Пары
              </span>
              <span className="legend-item">
                <i className="legend-swatch legend-swatch--deadlines" />
                Дедлайны
              </span>
              <span className="legend-item">
                <i className="legend-swatch legend-swatch--events" />
                Мероприятия
              </span>
            </div>
          </section>
        </div>

        <aside className="side-panel">
          <DeadlineModal />

          <div className="panel">
            <h3 className="panel__title">Ближайшие дедлайны</h3>
            {deadlines.length === 0 && <p className="doc-hint">Пока нет дедлайнов.</p>}
            {deadlines.map((d, i) => (
              <div className="deadline" key={d.id}>
                <div className={'deadline__date' + (i === 0 ? ' deadline__date--urgent' : '')}>
                  {d.due} · до {d.due_time}
                </div>
                <div className="deadline__title">{d.title}</div>
                <div className="deadline__sub">{d.subject}</div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3 className="panel__title">Мероприятия</h3>
            <div className="deadline deadline--event">
              <div className="deadline__date">Сегодня · 15:30–17:00</div>
              <div className="deadline__title">Встреча студсовета</div>
              <div className="deadline__sub">Актовый зал · корпус А</div>
            </div>
            <div className="deadline deadline--event">
              <div className="deadline__date">Вт, 24 ноя · 14:00</div>
              <div className="deadline__title">День карьеры</div>
              <div className="deadline__sub">Главный корпус · 2 этаж</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
