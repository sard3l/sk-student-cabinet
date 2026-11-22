'use client';

import { useEffect, useState } from 'react';

export default function StaffSchedule({ defaultDate }) {
  const [date, setDate] = useState(defaultDate);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(null);

  async function load(d) {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/schedule?date=${encodeURIComponent(d)}`);
      const data = await res.json().catch(() => ({}));
      setClasses(data.classes || []);
      setTeachers(data.teachers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function update(c, patch) {
    const key = c.group_name + c.time_start + c.discipline;
    setBusy(key);
    try {
      const res = await fetch('/api/staff/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: c.group_name,
          date: c.date,
          time_start: c.time_start,
          discipline: c.discipline,
          ...patch,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMsg('Сохранено');
        await load(date);
      } else {
        setMsg(data.error || 'Ошибка');
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="staff-schedule">
      <div className="staff-sched-toolbar">
        <label className="att-field">
          <span>Дата</span>
          <input
            type="date"
            className="field__input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        {msg && <span className="att-msg">{msg}</span>}
      </div>

      {loading ? (
        <p className="doc-hint">Загрузка…</p>
      ) : classes.length === 0 ? (
        <p className="doc-hint">На эту дату занятий нет.</p>
      ) : (
        <div className="staff-sched-list">
          {classes.map((c, i) => {
            const cancelled = Number(c.cancelled) === 1;
            const key = c.group_name + c.time_start + c.discipline + i;
            return (
              <div className={'staff-sched' + (cancelled ? ' is-cancelled' : '')} key={key}>
                <div className="staff-sched__main">
                  <span className="staff-sched__time">
                    {c.time_start}–{c.time_end}
                  </span>
                  <span className="staff-sched__disc">{c.discipline}</span>
                  <span className="staff-sched__meta">
                    {c.group_name} · {c.type} · {c.room}
                  </span>
                </div>

                <div className="staff-sched__actions">
                  <select
                    className="field__input staff-sched__teacher"
                    value={c.teacher}
                    disabled={busy === key || cancelled}
                    onChange={(e) => update(c, { teacher: e.target.value })}
                  >
                    {teachers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    {!teachers.includes(c.teacher) && <option value={c.teacher}>{c.teacher}</option>}
                  </select>
                  <button
                    className={'staff-sched__cancel' + (cancelled ? ' is-on' : '')}
                    disabled={busy === key}
                    onClick={() => update(c, { cancelled: !cancelled })}
                  >
                    {cancelled ? 'Вернуть' : 'Отменить'}
                  </button>
                </div>

                {cancelled && <span className="staff-sched__badge">Отменено</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
