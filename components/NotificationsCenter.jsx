'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = {
  deadline: { label: 'Дедлайны', href: '/calendar' },
  study: { label: 'Учёба', href: '/grades' },
  documents: { label: 'Документы', href: '/documents' },
  achievements: { label: 'Достижения', href: '/achievements' },
};

const ICON_BG = {
  'notif-clock': '#fff2df',
  'notif-edit': '#fff2df',
  'notif-file': '#fff2df',
  'notif-trophy': '#fff3d9',
  'notif-chart': '#eaf3ec',
  'notif-check': '#eeebf8',
};

export default function NotificationsCenter({ notifications }) {
  const router = useRouter();
  const [tab, setTab] = useState('all'); // all | unread | action
  const [cat, setCat] = useState('all'); // all | type
  const [query, setQuery] = useState('');

  const catOf = (n) => CATEGORIES[n.type] || CATEGORIES.study;

  async function markRead() {
    await fetch('/api/notifications', { method: 'POST' });
    router.refresh();
  }

  const filtered = notifications.filter((n) => {
    if (tab === 'unread' && n.read) return false;
    if (tab === 'action' && !n.requires_action) return false;
    if (cat !== 'all' && n.type !== cat) return false;
    if (query && !(n.title + ' ' + n.body).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const actionItems = filtered.filter((n) => n.requires_action);
  const regularItems = filtered.filter((n) => !n.requires_action);

  const unread = notifications.filter((n) => !n.read).length;
  const actionCount = notifications.filter((n) => n.requires_action).length;

  const tabs = [
    { key: 'all', label: `Все · ${notifications.length}` },
    { key: 'unread', label: `Непрочитанные · ${unread}` },
    { key: 'action', label: `Требуют действия · ${actionCount}` },
  ];

  const catCount = (t) => (t === 'all' ? notifications.length : notifications.filter((n) => n.type === t).length);

  return (
    <div className="notifpage">
      <div className="content__top notifpage__head">
        <h1 className="content__title">Уведомления</h1>
        <div className="notifpage__actions">
          <button className="notifpage__btn" onClick={markRead}>
            Прочитать все
          </button>
          <button className="notifpage__btn">Настройки</button>
        </div>
      </div>

      <div className="notifpage__filters">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={'notifpage__filter' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div className="notifpage__search">
          <img src="/assets/icons/notif-search.svg" alt="" width="18" height="18" />
          <input
            placeholder="Найти уведомление"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="notifpage__layout">
        <div className="notifpage__feed">
          {actionItems.length > 0 && (
            <div className="notifpage__group">
              <div className="notifpage__group-head">
                <span>Требуют действия</span>
                <span className="notifpage__count">{actionItems.length}</span>
              </div>
              {actionItems.map((n) => (
                <div className="ncard ncard--action" key={n.id}>
                  <div className="ncard__icon" style={{ background: ICON_BG[n.icon] || '#fff2df' }}>
                    <img src={`/assets/icons/${n.icon}.svg`} alt="" width="20" height="20" />
                  </div>
                  <div className="ncard__content">
                    <div className="ncard__meta">
                      <span className="ncard__cat">{catOf(n).label}</span>
                      {!n.read && <span className="ncard__new">Новое</span>}
                      <span className="ncard__time">{n.time_label}</span>
                    </div>
                    <div className="ncard__title">{n.title}</div>
                    <div className="ncard__body">{n.body}</div>
                    <div className="ncard__action-row">
                      <Link className="ncard__action-btn" href={catOf(n).href}>
                        {n.action_label}
                      </Link>
                      {n.action_meta && <span className="ncard__action-meta">{n.action_meta}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {regularItems.length > 0 && (
            <div className="notifpage__group">
              <div className="notifpage__group-head">
                <span>Остальные уведомления</span>
                <span className="notifpage__count">{regularItems.length}</span>
              </div>
              {regularItems.map((n) => (
                <div className={'ncard' + (n.read ? ' ncard--read' : '')} key={n.id}>
                  <div className="ncard__icon" style={{ background: ICON_BG[n.icon] || '#eaf3ec' }}>
                    <img src={`/assets/icons/${n.icon}.svg`} alt="" width="20" height="20" />
                  </div>
                  <div className="ncard__content">
                    <div className="ncard__meta">
                      <span className="ncard__cat">{catOf(n).label}</span>
                      {n.read ? (
                        <span className="ncard__read">Прочитано</span>
                      ) : (
                        <span className="ncard__new">Новое</span>
                      )}
                      <span className="ncard__time">{n.time_label}</span>
                    </div>
                    <div className="ncard__title">{n.title}</div>
                    <div className="ncard__body">{n.body}</div>
                    {n.action_label && (
                      <Link className="ncard__link" href={catOf(n).href}>
                        {n.action_label}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="doc-empty">Здесь пока пусто.</div>
          )}
        </div>

        <aside className="notifpage__side">
          <div className="notifpage__panel">
            <div className="notifpage__panel-title">По разделам</div>
            {['all', 'deadline', 'study', 'documents', 'achievements'].map((t) => (
              <button
                key={t}
                className={'notifpage__cat' + (cat === t ? ' is-active' : '')}
                onClick={() => setCat(t)}
              >
                <span>{t === 'all' ? 'Все уведомления' : CATEGORIES[t].label}</span>
                <span className="notifpage__count">{catCount(t)}</span>
              </button>
            ))}
          </div>

          <div className="notifpage__panel">
            <div className="notifpage__panel-title">Важное не потеряется</div>
            <p>Задачи остаются в блоке «Требуют действия», даже если уведомление уже прочитано.</p>
            <p>Когда действие выполнено, карточка переместится в общую ленту.</p>
          </div>

          <div className="notifpage__panel">
            <div className="notifpage__panel-title">Только нужные темы</div>
            <p>В настройках можно выбрать категории и способы получения уведомлений.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
