'use client';

import { useRouter } from 'next/navigation';

const STATUSES = ['На рассмотрении', 'Принята', 'Нужно исправить', 'Отклонена'];

export default function StaffRequests({ requests }) {
  const router = useRouter();

  async function setStatus(id, status) {
    await fetch('/api/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Заявки студентов</h1>
      </div>
      <div className="staff-head" style={{ marginBottom: 16 }}>
        <span className="count">Всего заявок: {requests.length}</span>
      </div>
      <div className="staff-list">
        {requests.length === 0 && <p style={{ color: 'var(--muted-3)' }}>Заявок пока нет.</p>}
        {requests.map((r) => (
          <div className="staff-item" key={r.id}>
            <div className="staff-item__info">
              <strong>{r.title}</strong>
              <span>
                {r.user_name} · {r.group_name || 'сотрудник'} · {r.created_at}
              </span>
            </div>
            <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
