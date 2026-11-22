'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationsBell from './NotificationsBell.jsx';

const NAV = [
  { href: '/', label: 'Главная', white: 'home_white', green: 'home', mobile: true, short: 'Главная' },
  { href: '/calendar', label: 'Календарь', white: 'calendar_today', green: 'calendar_green', mobile: true, short: 'Календарь' },
  { href: '/grades', label: 'Успеваемость', white: 'bar_chart', green: 'bar_chart_green', mobile: true, short: 'Успеваемость' },
  { href: '/gradebook', label: 'Зачетная книжка', white: 'import_contacts', green: 'import_contacts_green', mobile: true, short: 'Зачетная' },
  { href: '/documents', label: 'Документы', white: 'docs', green: 'docs_green' },
  { href: '/news', label: 'Новости', white: 'news', green: 'news_green' },
  { href: '/assistant', label: 'Помощник', white: 'chat', green: 'chat_green' },
  { href: '/achievements', label: 'Достижения', white: 'workspace_premium', green: 'workspace_premium_green' },
];

export default function CabinetShell({ user, notifications, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems =
    user.role === 'staff'
      ? [{ href: '/', label: 'Заявки', white: 'docs', green: 'docs_green', mobile: true, short: 'Заявки' }]
      : NAV;

  const initials = (user.name || '')
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const group = user.group_name || (user.role === 'staff' ? 'Сотрудник' : '');

  function isActive(href) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__left">
            <button
              className="topbar__menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <img src="/assets/icons/menu.svg" alt="" width="24" height="24" />
            </button>
            <div className="search">
              <img src="/assets/icons/search.svg" alt="" width="24" height="24" />
              <span className="search__placeholder">Поиск</span>
            </div>
          </div>

          <div className="topbar__right">
            <div className="profile">
              <span className="profile__name">{user.name}</span>
              <span className="profile__group">{group}</span>
            </div>
            <div className="avatar" aria-hidden="true">
              {initials}
            </div>
            <NotificationsBell notifications={notifications} />
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav className="sidebar__nav">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  className={'nav__item' + (active ? ' nav__item--active' : '')}
                  href={item.href}
                >
                  <img
                    src={`/assets/icons/${active ? item.green : item.white}.svg`}
                    alt=""
                    width="24"
                    height="24"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar__footer">
            <button className="icon-btn" aria-label="Настройки">
              <img src="/assets/icons/settings.svg" alt="" width="24" height="24" />
            </button>
            <button className="icon-btn" onClick={logout} aria-label="Выйти">
              <img src="/assets/icons/logout.svg" alt="" width="24" height="24" />
            </button>
          </div>
        </aside>

        <main className="content">
          {children}
          <footer className="page-footer">
            Концепт для конкурса «Цифровой деканат будущего». Не является официальным сервисом вуза.
            Все данные вымышленные.
          </footer>
        </main>
      </div>

      {menuOpen && (
        <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
          <nav
            className="mobile-menu__panel"
            onClick={(e) => e.stopPropagation()}
            aria-label="Меню"
          >
            <div className="mobile-menu__head">
              <span>Меню</span>
              <button
                className="mobile-menu__close"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                ×
              </button>
            </div>

            <div className="mobile-menu__nav">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    className={'mobile-menu__item' + (active ? ' is-active' : '')}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    <img
                      src={`/assets/icons/${active ? item.green : item.white}.svg`}
                      alt=""
                      width="22"
                      height="22"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mobile-menu__footer">
              <button className="mobile-menu__action" aria-label="Настройки">
                <img src="/assets/icons/settings.svg" alt="" width="22" height="22" />
                <span>Настройки</span>
              </button>
              <button className="mobile-menu__action" onClick={logout} aria-label="Выйти">
                <img src="/assets/icons/logout.svg" alt="" width="22" height="22" />
                <span>Выйти</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Основная навигация">
        {navItems.filter((i) => i.mobile).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              className={'mobile-nav__item' + (active ? ' mobile-nav__item--active' : '')}
              href={item.href}
            >
              <img
                src={`/assets/icons/${active ? item.green : item.white}.svg`}
                alt=""
                width="24"
                height="24"
              />
              <span>{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
