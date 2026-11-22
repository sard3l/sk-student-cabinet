import { getScheduleBetween, getDisciplines, getAllRequests, getNotes, getNews } from '@/lib/db.js';
import { getCurrentUser } from '@/lib/session.js';
import { redirect } from 'next/navigation';
import { todayISO, formatDateRu } from '@/lib/term.js';
import StaffRequests from '@/components/StaffRequests.jsx';
import NotesWidget from '@/components/NotesWidget.jsx';

const BADGE = {
  Лекция: 'badge--lecture',
  Практика: 'badge--practice',
  Семинар: 'badge--practice-soft',
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role === 'staff') {
    return <StaffRequests requests={getAllRequests()} />;
  }

  const today = todayISO();
  const schedule = getScheduleBetween(user.id, today, today); // занятия «сегодня»
  const disciplines = getDisciplines(user.id);
  const weakest = [...disciplines].sort((a, b) => a.total - b.total).slice(0, 3);
  const notes = getNotes(user.id);
  const news = getNews();

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Главная</h1>
        <button className="icon-btn icon-btn--edit" aria-label="Настроить виджеты">
          <img src="/assets/icons/edit.svg" alt="" width="30" height="30" />
        </button>
      </div>
      <p className="content__date">Сегодня, {formatDateRu(today)}</p>

      <div className="widgets">
        {/* Расписание */}
        <section className="widget widget--schedule">
          <div className="widget__head">
            <h2 className="widget__title">Расписание</h2>
            <a className="icon-btn icon-btn--more" href="/calendar" aria-label="Открыть расписание">
              <img src="/assets/icons/chevron_right.svg" alt="" width="30" height="30" />
            </a>
          </div>

          <ul className="classes">
            {schedule.length === 0 && (
              <li className="class" style={{ justifyContent: 'center', color: 'var(--muted-3)' }}>
                На сегодня занятий нет
              </li>
            )}
            {schedule.map((c, i) => {
              const current = i === 0;
              return (
                <li key={c.id} className={'class' + (current ? ' class--current' : '')}>
                  <div className="class__body">
                    <div className="class__title">{c.discipline}</div>
                    <div className="class__row">
                      <img
                        src={`/assets/icons/${current ? 'person' : 'person_green'}.svg`}
                        alt=""
                        width="14"
                        height="14"
                      />
                      {c.teacher}
                    </div>
                    <div className="class__row">
                      <img
                        src={`/assets/icons/${current ? 'location_on' : 'location_on_green'}.svg`}
                        alt=""
                        width="14"
                        height="14"
                      />
                      {c.room}
                    </div>
                  </div>
                  <div className="class__side">
                    <span className={'badge ' + (BADGE[c.type] || 'badge--lecture')}>{c.type}</span>
                    <div className="class__when">
                      {current && <span className="class__now">Сейчас</span>}
                      <span className="class__time">
                        {c.time_start}–{c.time_end}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Новости */}
        <section className="widget widget--news">
          <div className="widget__head">
            <h2 className="widget__title">Новости</h2>
            <a className="widget__all" href="/news">
              Все новости
            </a>
          </div>

          <ul className="news">
            {news.slice(0, 3).map((n) => (
              <li className="news__item" key={n.id}>
                <a className="news__text" href="/news">
                  <div className="news__title">{n.title}</div>
                  <div className="news__desc">{n.summary}</div>
                </a>
                <a className="news__chevron" href="/news" aria-label="Открыть новости">
                  <img
                    src="/assets/icons/chevron_right_green.svg"
                    alt=""
                    width="34"
                    height="34"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Успеваемость */}
        <section className="widget widget--performance">
          <div className="widget__head">
            <h2 className="widget__title">Успеваемость</h2>
          </div>
          <p className="performance__hint">Тебе следует подтянуть оценки по этим предметам</p>

          <ul className="performance">
            {weakest.map((d) => (
              <li className="perf" key={d.id}>
                <div className="perf__name">{d.name}</div>
                <div className="perf__row">
                  <div className="perf__bar">
                    <span style={{ width: d.total + '%' }} />
                  </div>
                  <div className="perf__score">{d.total} / 100</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Заметки */}
        <NotesWidget notes={notes} />
      </div>
    </>
  );
}
