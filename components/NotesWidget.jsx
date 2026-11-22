'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesWidget({ notes }) {
  const router = useRouter();
  const [text, setText] = useState('');

  async function add(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t }),
    });
    setText('');
    router.refresh();
  }

  async function remove(id) {
    await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <section className="widget widget--notes">
      <div className="widget__head">
        <h2 className="widget__title">Заметки</h2>
      </div>

      <form className="notes__add" onSubmit={add}>
        <input
          type="text"
          placeholder="Написать заметку…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="notes__plus" type="submit" aria-label="Добавить заметку">
          +
        </button>
      </form>

      <ul className="notes">
        {notes.length === 0 && <li className="notes__empty">Пока нет заметок</li>}
        {notes.map((n) => (
          <li key={n.id}>
            <span className="notes__text">{n.text}</span>
            <button className="notes__del" onClick={() => remove(n.id)} aria-label="Удалить">
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
