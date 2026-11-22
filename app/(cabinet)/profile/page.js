import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isStaff = user.role === 'staff';

  const initials = (user.name || '')
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const rows = isStaff
    ? [
        ['ФИО', user.name],
        ['Роль', 'Сотрудник'],
        ['Логин', user.login],
      ]
    : [
        ['ФИО', user.name],
        ['Курс', user.course || '—'],
        ['Группа', user.group_name || '—'],
        ['Факультет', user.faculty || '—'],
        ['Направление', user.program || '—'],
      ];

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Профиль</h1>
      </div>

      <div className="profile-page">
        <section className="student-card">
          <div className="student-card__head">
            <div className="student-card__avatar">{initials}</div>
            <div className="student-card__meta">
              <h2 className="student-card__name">{user.name}</h2>
              <span className="student-card__role">
                {isStaff ? 'Сотрудник' : `Студент${user.course ? ' · ' + user.course : ''}`}
              </span>
            </div>
          </div>

          <dl className="student-card__rows">
            {rows.map(([label, value]) => (
              <div className="student-card__row" key={label}>
                <dt className="student-card__label">{label}</dt>
                <dd className="student-card__value">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
