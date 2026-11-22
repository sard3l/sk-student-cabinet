'use client';

import { useState } from 'react';

const ACHIEVEMENTS = [
  { icon: 'ach-coin', bg: '#fff3d9', title: 'Первый десяток', desc: 'Набрать первые 10 баллов по любой дисциплине.', status: 'got', plabel: '10 из 10 · баллов', pct: 100 },
  { icon: 'ach-calendar', bg: '#eaf3ec', title: 'Повелитель дедлайнов', desc: 'Добавить в календарь 5 личных дедлайнов.', status: 'got', plabel: '5 из 5 · дедлайнов', pct: 100 },
  { icon: 'ach-paper', bg: '#eeebf8', title: 'Бумажный ниндзя', desc: 'Заказать и получить свой первый документ.', status: 'got', plabel: '1 из 1 · документ', pct: 100 },
  { icon: 'ach-ticket', bg: '#eaf1fa', title: 'Есть контакт!', desc: 'Посетить 3 студенческих мероприятия.', status: 'progress', plabel: '2 из 3 · мероприятия', pct: 67 },
  { icon: 'ach-retry', bg: '#fff0e6', title: 'Вторая попытка — огонь', desc: 'Получить «Принята» после доработки учебной работы.', status: 'progress', plabel: '0 из 1 · работа', pct: 0 },
  { icon: 'ach-chart', bg: '#fff3d9', title: 'Балльный магнат', desc: 'Набрать 50 баллов по одной дисциплине.', status: 'progress', plabel: '42 из 50 · баллов', pct: 84 },
  { icon: 'ach-check', bg: '#eaf3ec', title: 'Без хвостов', desc: 'Закрыть все дисциплины семестра без задолженностей.', status: 'progress', plabel: '6 из 7 · дисциплин', pct: 86 },
  { icon: 'ach-book', bg: '#f0f3f0', title: 'Курсовой герой', desc: 'Успешно сдать свою первую курсовую работу.', status: 'ahead', plabel: '0 из 1 · работа', pct: 0 },
  { icon: 'ach-cap', bg: '#f0f3f0', title: 'Финальный босс', desc: 'Защитить ВКР. Главная награда студенческого квеста.', status: 'ahead', plabel: '0 из 1 · защита', pct: 0 },
  { icon: 'ach-check', bg: '#eaf3ec', title: 'Идеальная посещаемость', desc: 'Не пропустить ни одного занятия за семестр.', status: 'progress', plabel: '45 из 46 · занятий', pct: 98 },
  { icon: 'ach-book', bg: '#eeebf8', title: 'Ночной зубрёжник', desc: 'Зайти в кабинет после 23:00 три раза.', status: 'got', plabel: '3 из 3 · ночей', pct: 100 },
  { icon: 'ach-coin', bg: '#fff3d9', title: 'Мастер заметок', desc: 'Создать 10 заметок в кабинете.', status: 'progress', plabel: '4 из 10 · заметок', pct: 40 },
  { icon: 'ach-calendar', bg: '#eaf1fa', title: 'Полиглот', desc: 'Получить «отлично» по иностранному языку.', status: 'ahead', plabel: '0 из 1 · экзамен', pct: 0 },
  { icon: 'ach-book', bg: '#f0f3f0', title: 'Библиотечный житель', desc: 'Провести 5 часов в библиотеке за семестр.', status: 'progress', plabel: '3 из 5 · часов', pct: 60 },
  { icon: 'ach-retry', bg: '#fff0e6', title: 'Спринтер дедлайнов', desc: 'Сдать работу за час до дедлайна.', status: 'ahead', plabel: '0 из 1 · работа', pct: 0 },
];

const STATUS = { got: '✓ Получено', progress: 'В процессе', ahead: 'Впереди' };

const FILTERS = [
  { key: 'all', label: `Все · ${ACHIEVEMENTS.length}` },
  { key: 'got', label: `Полученные · ${ACHIEVEMENTS.filter((a) => a.status === 'got').length}` },
  { key: 'progress', label: `В процессе · ${ACHIEVEMENTS.filter((a) => a.status === 'progress').length}` },
  { key: 'ahead', label: `Впереди · ${ACHIEVEMENTS.filter((a) => a.status === 'ahead').length}` },
];

export default function Achievements() {
  const [filter, setFilter] = useState('all');

  const got = ACHIEVEMENTS.filter((a) => a.status === 'got').length;
  const total = ACHIEVEMENTS.length;
  const visible = ACHIEVEMENTS.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="achievements">
      <div className="ach-progress">
        <div className="ach-progress__about">
          <h2 className="ach-progress__title">Твой студенческий квест</h2>
          <p className="ach-progress__sub">Учись, пробуй новое и собирай свою коллекцию наград.</p>
          <p className="ach-progress__note">Без рейтинга и гонки с другими — только твой прогресс.</p>
        </div>
        <div className="ach-progress__stats">
          <span className="ach-progress__count">
            {got} из {total}
          </span>
          <span className="ach-progress__caption">достижений получено</span>
          <div className="ach-progress__bar">
            <span style={{ width: ((got / total) * 100).toFixed(1) + '%' }} />
          </div>
        </div>
        <div className="award-illus" aria-hidden="true">
          <div className="award-illus__layer" style={{ inset: '51.92% 28.53% 13.32% 28.53%' }}>
            <img src="/assets/icons/award-ribbon.svg" alt="" />
          </div>
          <div className="award-illus__layer" style={{ inset: '45.19% 73.44% 29.81% 13.28%' }}>
            <img src="/assets/icons/award-laurel-left.svg" alt="" />
          </div>
          <div className="award-illus__layer" style={{ inset: '45.19% 13.28% 29.81% 73.44%' }}>
            <img src="/assets/icons/award-laurel-right.svg" alt="" />
          </div>
          <div className="award-illus__layer" style={{ inset: '13.46% 30.47% 38.46% 30.47%' }}>
            <img src="/assets/icons/award-medallion.svg" alt="" />
          </div>
          <div className="award-illus__layer" style={{ inset: '19.23% 16.41% 64.42% 15.63%' }}>
            <img src="/assets/icons/award-sparkles.svg" alt="" />
          </div>
        </div>
      </div>

      <div className="ach-filters" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={'ach-filter' + (filter === f.key ? ' is-active' : '')}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ach-head">
        <h2>Маленькие победы. Большой путь.</h2>
        <span>Условия получения — в каждой карточке</span>
      </div>

      <div className="ach-grid">
        {visible.map((a) => (
          <div
            key={a.title}
            className={'ach-card' + (a.status === 'got' ? ' ach-card--got' : '')}
          >
            <div className="ach-card__top">
              <div className="ach-card__icon" style={{ background: a.bg }}>
                <img src={`/assets/icons/${a.icon}.svg`} alt="" />
              </div>
              <span
                className={'ach-card__status' + (a.status === 'got' ? ' ach-card__status--got' : '')}
              >
                {STATUS[a.status]}
              </span>
            </div>
            <div className="ach-card__title">{a.title}</div>
            <div className="ach-card__desc">{a.desc}</div>
            <div
              className={'ach-card__plabel' + (a.status === 'got' ? ' ach-card__plabel--got' : '')}
            >
              {a.plabel}
            </div>
            <div className="ach-card__bar">
              {a.pct > 0 && <span style={{ width: a.pct + '%' }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
