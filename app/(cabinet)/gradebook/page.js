import { getGradebook, getGradebookSemesters } from '@/lib/db.js';
import { getCurrentUser } from '@/lib/session.js';
import { redirect } from 'next/navigation';
import SemesterSelect from '@/components/SemesterSelect.jsx';

export default async function GradebookPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const semesters = getGradebookSemesters(user.id);
  const current = sp.semester || semesters[semesters.length - 1];
  const records = getGradebook(user.id).filter((r) => r.semester === current);

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Зачётная книжка</h1>
      </div>

      <div className="gradebook">
        <div className="grades-filters">
          <SemesterSelect semesters={semesters} current={current} />
          <span className="grades-count">Итоговые результаты · {records.length} дисциплин</span>
        </div>

        <div className="gradebook-table">
          <div className="gb-row gb-row--head">
            <div className="gb-cell gb-cell--subject">Дисциплина</div>
            <div className="gb-cell gb-cell--form">Форма контроля</div>
            <div className="gb-cell gb-cell--result">Результат</div>
          </div>

          {records.length === 0 && (
            <div className="gb-row">
              <div className="gb-cell gb-cell--subject" style={{ color: 'var(--muted-3)' }}>
                Нет данных за этот семестр
              </div>
            </div>
          )}

          {records.map((r, i) => (
            <div className={'gb-row' + (i % 2 ? ' gb-row--alt' : '')} key={r.id}>
              <div className="gb-cell gb-cell--subject">{r.discipline}</div>
              <div className="gb-cell gb-cell--form">{r.form}</div>
              <div className="gb-cell gb-cell--result">
                {r.result === 'Зачёт' || r.result === 'Незачёт' ? (
                  <span
                    className={'gb-badge ' + (r.result === 'Зачёт' ? 'gb-badge--pass' : 'gb-badge--fail')}
                  >
                    {r.result}
                  </span>
                ) : (
                  <>
                    <span className="gb-score">{r.result}</span>
                    <span className="gb-unit">баллов</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
