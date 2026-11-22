'use client';

import { useState } from 'react';

const CURRENT_SEMESTER = '1 семестр · 2026/27';

export default function GradesJournal({ disciplines, dates, pastSemesters }) {
  const [semester, setSemester] = useState(CURRENT_SEMESTER);
  const [from, setFrom] = useState(dates[0].date);
  const [to, setTo] = useState(dates[dates.length - 1].date);

  const semesters = [CURRENT_SEMESTER, ...pastSemesters];

  // видимые индексы дат в выбранном диапазоне
  const visible = [];
  dates.forEach((d, i) => {
    if (d.date >= from && d.date <= to) visible.push(i);
  });

  // посещаемость по видимым ячейкам
  let filled = 0;
  let absent = 0;
  for (const d of disciplines) {
    for (const i of visible) {
      const m = d.marks[i];
      if (m != null) {
        filled += 1;
        if (m === 'н') absent += 1;
      }
    }
  }
  const present = filled - absent;
  const pct = filled ? ((present / filled) * 100).toFixed(1).replace('.', ',') : '0,0';

  const noJournal = semester !== CURRENT_SEMESTER;

  return (
    <div className="grades-journal">
      <div className="grades-filters">
        <div className="field__select grades-semester">
          <select
            className="field__input"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="field__chevron" aria-hidden="true">
            ⌄
          </span>
        </div>

        <div className="grades-date-range">
          <input
            className="field__input"
            type="date"
            min={dates[0].date}
            max={dates[dates.length - 1].date}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>—</span>
          <input
            className="field__input"
            type="date"
            min={dates[0].date}
            max={dates[dates.length - 1].date}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <span className="grades-count">Всего {disciplines.length} дисциплин</span>
      </div>

      {noJournal ? (
        <div className="doc-empty">Нет данных журнала за этот семестр. Он доступен в «Зачётной книжке».</div>
      ) : (
        <>
          <div className="grades-scroll">
            <div className="grades-table">
              <div className="grades-col grades-col--subject">
                <div className="gcell gcell--head">Дисциплина</div>
                {disciplines.map((d, i) => (
                  <div key={d.id} className={'gcell gcell--subject' + (i % 2 ? ' gcell--alt' : '')}>
                    <span className="gsubj__name">{d.name}</span>
                    <span className="gsubj__teacher">{d.teacher}</span>
                  </div>
                ))}
              </div>

              <div className="grades-col grades-col--total">
                <div className="gcell gcell--head gcell--head--total">
                  <span>Всего</span>
                  <span>баллов</span>
                </div>
                {disciplines.map((d, i) => (
                  <div key={d.id} className={'gcell gcell--total' + (i % 2 ? ' gcell--alt' : '')}>
                    {d.total}
                  </div>
                ))}
              </div>

              <div className="grades-dates">
                <div className="grades-dates__inner">
                  <div className="gdates-row">
                    {visible.length === 0 && (
                      <div className="gcell gcell--date" style={{ width: '100%', color: 'var(--muted-3)' }}>
                        Нет занятий в этом диапазоне
                      </div>
                    )}
                    {visible.map((i) => {
                      const d = dates[i];
                      return (
                        <div className="gcell gcell--date" key={d.date}>
                          <span className="d">{d.label}</span>
                          <span className="wd">{d.dowLabel}</span>
                        </div>
                      );
                    })}
                  </div>

                  {disciplines.map((d, ri) => (
                    <div className="gdates-row" key={d.id}>
                      {visible.map((i) => {
                        const m = d.marks[i];
                        const cls = 'gcell' + (ri % 2 ? ' gcell--alt' : '');
                        if (m === 'н') {
                          return (
                            <div className={cls + ' gcell--absent'} key={i}>
                              <span className="badge-n">н</span>
                            </div>
                          );
                        }
                        if (m == null) return <div className={cls} key={i} />;
                        return (
                          <div className={cls} key={i}>
                            {m}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="attendance">
            <span className="attendance__pct">{pct} %</span>
            <div className="attendance__text">
              <span className="attendance__title">Посещаемость за выбранный период</span>
              <span className="attendance__sub">
                По заполненным ячейкам: {present} из {filled} занятий · пустые ячейки не учитываются
              </span>
            </div>
            <div className="attendance__bar">
              <span style={{ width: pct.replace(',', '.') + '%' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
