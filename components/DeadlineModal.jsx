'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeadlineModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('2026-11-27');
  const [time, setTime] = useState('18:00');

  async function submit(e) {
    e.preventDefault();
    const due = date ? date.split('-').reverse().join('.') : '';
    await fetch('/api/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, due, due_time: time }),
    });
    setOpen(false);
    setTitle('');
    router.refresh();
  }

  return (
    <>
      <button className="add-btn" onClick={() => setOpen(true)}>
        +&nbsp;&nbsp;Добавить
      </button>

      {open && (
        <div
          className="modal-overlay is-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__head">
              <div className="modal__titles">
                <h2 className="modal__title">Добавить в календарь</h2>
                <p className="modal__subtitle">Сохраните важное — я напомню вовремя.</p>
              </div>
              <button className="modal__close" onClick={() => setOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <form className="form" onSubmit={submit}>
              <div className="field">
                <label className="field__label" htmlFor="dlTitle">
                  Название *
                </label>
                <input
                  className="field__input"
                  id="dlTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например, эссе по истории"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="dlSubject">
                  Предмет
                </label>
                <div className="field__select">
                  <select
                    className="field__input"
                    id="dlSubject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="">—</option>
                    <option>Менеджмент</option>
                    <option>Информатика</option>
                    <option>История России</option>
                    <option>Экономическая теория</option>
                  </select>
                  <span className="field__chevron" aria-hidden="true">
                    ⌄
                  </span>
                </div>
              </div>

              <div className="field__row">
                <div className="field">
                  <label className="field__label" htmlFor="dlDate">
                    Дата *
                  </label>
                  <input
                    className="field__input"
                    id="dlDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="dlTime">
                    Время *
                  </label>
                  <input
                    className="field__input"
                    id="dlTime"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal__actions">
                <span className="modal__required">* Обязательные поля</span>
                <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-submit">
                  Добавить дедлайн
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
