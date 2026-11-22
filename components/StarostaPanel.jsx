'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StarostaPanel({ group, members, disciplines, today, todayLabel }) {
  const router = useRouter();

  const [tab, setTab] = useState('attendance');

  // --- Посещаемость ---
  const [date, setDate] = useState(today);
  const [discipline, setDiscipline] = useState(disciplines[0] || 'Пара');
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [attMsg, setAttMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    const q = `date=${encodeURIComponent(date)}&discipline=${encodeURIComponent(discipline)}`;
    fetch(`/api/attendance?${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.ok) setMarks(d.marks || {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date, discipline]);

  function toggle(id, value) {
    setMarks((m) => ({ ...m, [id]: value }));
  }

  function markAllPresent() {
    const next = {};
    for (const m of members) next[m.id] = true;
    setMarks(next);
  }

  async function saveAttendance() {
    const payload = members
      .filter((m) => marks[m.id] != null)
      .map((m) => ({ memberId: m.id, present: marks[m.id] === true }));
    if (payload.length === 0) {
      setAttMsg('Отметьте хотя бы одного студента');
      return;
    }
    setSaving(true);
    setAttMsg('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, discipline, marks: payload }),
      });
      const data = await res.json().catch(() => ({}));
      setAttMsg(data.ok ? 'Посещаемость сохранена' : data.error || 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  // --- Рассылка ---
  const [modal, setModal] = useState(null); // 'deadline' | 'broadcast' | null
  const [dl, setDl] = useState({ title: '', due: today, time: '18:00' });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  async function sendDeadline(e) {
    e.preventDefault();
    if (!dl.title.trim() || !dl.due) return;
    setSending(true);
    try {
      const res = await fetch('/api/starosta/deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: dl.title, due: dl.due, due_time: dl.time }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setSendMsg(`Дедлайн отправлен ${data.count} одногруппникам — добавлен в календарь`);
        setModal(null);
        setDl({ title: '', due: today, time: '18:00' });
        router.refresh();
      } else {
        setSendMsg(data.error || 'Ошибка');
      }
    } finally {
      setSending(false);
    }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/starosta/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setSendMsg(`Сообщение отправлено ${data.count} одногруппникам`);
        setModal(null);
        setText('');
        router.refresh();
      } else {
        setSendMsg(data.error || 'Ошибка');
      }
    } finally {
      setSending(false);
    }
  }

  const present = members.filter((m) => marks[m.id] === true).length;
  const absent = members.filter((m) => marks[m.id] === false).length;

  return (
    <div className="starosta">
      <div className="doc-tabs" role="tablist">
        <button
          className={'doc-tab' + (tab === 'attendance' ? ' is-active' : '')}
          onClick={() => setTab('attendance')}
        >
          Посещаемость
        </button>
        <button
          className={'doc-tab' + (tab === 'broadcast' ? ' is-active' : '')}
          onClick={() => setTab('broadcast')}
        >
          Рассылка
        </button>
      </div>

      {tab === 'attendance' && (
        <div className="starosta-panel">
          <div className="att-toolbar">
            <label className="att-field">
              <span>Дата</span>
              <input
                type="date"
                className="field__input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="att-field">
              <span>Дисциплина</span>
              <select
                className="field__input"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Пара">Пара</option>
              </select>
            </label>
            <button type="button" className="att-all" onClick={markAllPresent}>
              Все были
            </button>
          </div>

          <div className="att-summary">
            <span>
              Группа {group} · {todayLabel}
            </span>
            <span>
              Были: {present} · Не были: {absent}
            </span>
          </div>

          <ul className="att-list">
            {members.map((m, i) => {
              const v = marks[m.id];
              return (
                <li className="att-row" key={m.id}>
                  <span className="att-num">{i + 1}</span>
                  <span className="att-name">{m.name}</span>
                  <div className="att-toggle">
                    <button
                      type="button"
                      className={'att-btn att-btn--yes' + (v === true ? ' is-on' : '')}
                      onClick={() => toggle(m.id, true)}
                    >
                      Был
                    </button>
                    <button
                      type="button"
                      className={'att-btn att-btn--no' + (v === false ? ' is-on' : '')}
                      onClick={() => toggle(m.id, false)}
                    >
                      Не был
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="att-actions">
            <button className="att-save" onClick={saveAttendance} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить посещаемость'}
            </button>
            {attMsg && <span className="att-msg">{attMsg}</span>}
          </div>
        </div>
      )}

      {tab === 'broadcast' && (
        <div className="starosta-panel">
          <p className="starosta-hint">
            Отправьте всей группе {group} дедлайн или сообщение.
          </p>
          <div className="broadcast-actions">
            <button
              className="broadcast-btn"
              onClick={() => {
                setSendMsg('');
                setModal('deadline');
              }}
            >
              <span className="broadcast-btn__icon">📅</span>
              <span className="broadcast-btn__title">Дедлайн</span>
              <span className="broadcast-btn__sub">Добавить в календарь группе</span>
            </button>
            <button
              className="broadcast-btn"
              onClick={() => {
                setSendMsg('');
                setModal('broadcast');
              }}
            >
              <span className="broadcast-btn__icon">✉️</span>
              <span className="broadcast-btn__title">Рассылка</span>
              <span className="broadcast-btn__sub">Отправить уведомление группе</span>
            </button>
          </div>
          {sendMsg && <div className="starosta-success">{sendMsg}</div>}
        </div>
      )}

      {modal === 'deadline' && (
        <div
          className="modal-overlay is-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <form className="modal" onSubmit={sendDeadline}>
            <div className="modal__head">
              <div className="modal__titles">
                <h2 className="modal__title">Новый дедлайн</h2>
                <p className="modal__subtitle">Добавится в календарь всем одногруппникам</p>
              </div>
              <button type="button" className="modal__close" onClick={() => setModal(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="field">
              <label className="field__label">Название</label>
              <input
                className="field__input"
                value={dl.title}
                onChange={(e) => setDl({ ...dl, title: e.target.value })}
                placeholder="Например, сдать лабораторную"
              />
            </div>
            <div className="field__row">
              <div className="field">
                <label className="field__label">Дата</label>
                <input
                  type="date"
                  className="field__input"
                  value={dl.due}
                  onChange={(e) => setDl({ ...dl, due: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label">Время</label>
                <input
                  type="time"
                  className="field__input"
                  value={dl.time}
                  onChange={(e) => setDl({ ...dl, time: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="doc-submit" disabled={sending}>
              {sending ? 'Отправка…' : 'Отправить всем одногруппникам'}
            </button>
          </form>
        </div>
      )}

      {modal === 'broadcast' && (
        <div
          className="modal-overlay is-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <form className="modal" onSubmit={sendBroadcast}>
            <div className="modal__head">
              <div className="modal__titles">
                <h2 className="modal__title">Рассылка группе</h2>
                <p className="modal__subtitle">Все одногруппники получат уведомление</p>
              </div>
              <button type="button" className="modal__close" onClick={() => setModal(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="field">
              <label className="field__label">Сообщение</label>
              <textarea
                className="field__input field__textarea"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишите сообщение группе…"
              />
            </div>
            <button type="submit" className="doc-submit" disabled={sending}>
              {sending ? 'Отправка…' : 'Отправить всем одногруппникам'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
