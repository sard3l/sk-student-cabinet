'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsBell({ notifications = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const last3 = notifications.slice(0, 3);

  async function markRead() {
    await fetch('/api/notifications', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="notif">
      <button
        className="icon-btn icon-btn--bell"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
      >
        <img src="/assets/icons/notifications.svg" alt="" width="34" height="34" />
        {unread > 0 && <span className="notif__badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif__panel">
          <div className="notif__head">
            <span>Уведомления</span>
            {unread > 0 && (
              <button className="notif__mark" onClick={markRead}>
                Прочитать все
              </button>
            )}
          </div>

          {last3.length === 0 && <p className="notif__empty">Пока нет уведомлений</p>}
          {last3.map((n) => (
            <div className={'notif__item' + (n.read ? '' : ' notif__item--unread')} key={n.id}>
              <strong>{n.title}</strong>
              <span>{n.body}</span>
            </div>
          ))}

          <Link className="notif__all" href="/notifications" onClick={() => setOpen(false)}>
            Все уведомления →
          </Link>
        </div>
      )}
    </div>
  );
}
