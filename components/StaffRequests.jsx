'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function statusClass(s) {
  if (['Готово', 'Готово к выдаче', 'Выполнено', 'Принята', 'Проверена'].includes(s)) return 'oh-badge--ready';
  return 'oh-badge--work';
}

export default function StaffRequests({ requests }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  // Раздел для справок и выписок из приказа.
  const orders = requests.filter((r) => r.kind === 'order');

  async function setStatus(id, status) {
    setBusy(id);
    try {
      await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setMsg(`Статус изменён: ${status}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function upload(id, file) {
    if (!file) return;
    setBusy(id);
    try {
      const body = new FormData();
      body.append('requestId', id);
      body.append('file', file);
      const res = await fetch('/api/staff/requests/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      setMsg(data.ok ? 'Файл загружен, заявка готова' : data.error || 'Ошибка загрузки');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Заявки</h1>
      </div>
      <p className="staff-sub">Справки и выписки из приказа</p>

      <div className="staff-head">
        <span className="count">Всего заявок: {orders.length}</span>
      </div>

      {msg && <div className="starosta-success">{msg}</div>}

      <div className="staff-list">
        {orders.length === 0 && <p className="doc-hint">Заявок пока нет.</p>}
        {orders.map((r) => (
          <div className="staff-item" key={r.id}>
            <div className="staff-item__info">
              <strong>{r.title}</strong>
              <span>
                {r.user_name} · {r.group_name || '—'} · {r.created_at}
              </span>
              <span className={'oh-badge ' + statusClass(r.status)}>{r.status}</span>
            </div>

            <div className="staff-item__actions">
              <button
                className="staff-btn"
                disabled={busy === r.id}
                onClick={() => setStatus(r.id, 'В работе')}
              >
                В работе
              </button>
              <button
                className="staff-btn staff-btn--ready"
                disabled={busy === r.id}
                onClick={() => setStatus(r.id, 'Готово')}
              >
                Готово
              </button>
              <label className="staff-upload">
                Загрузить
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  hidden
                  onChange={(e) => upload(r.id, e.target.files[0])}
                />
              </label>
              {r.result_file && (
                <a
                  className="staff-download"
                  href={`/api/requests/${r.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Файл ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
