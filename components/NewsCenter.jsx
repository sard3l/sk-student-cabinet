'use client';

import { useState } from 'react';
import { formatNewsDate } from '@/lib/term.js';

export default function NewsCenter({ news }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="news-list">
        {news.length === 0 && <div className="doc-empty">Новостей пока нет.</div>}
        {news.map((n) => (
          <button className="news-card" key={n.id} onClick={() => setSelected(n)}>
            <span className="news-card__accent" aria-hidden="true" />
            <span className="news-card__top">
              <span className="news-card__icon">
                <img src="/assets/icons/news_green.svg" alt="" width="20" height="20" />
              </span>
              <span className="news-card__date">{formatNewsDate(n.created_at)}</span>
            </span>
            <span className="news-card__title">{n.title}</span>
            <span className="news-card__summary">{n.summary}</span>
            <span className="news-card__more">
              Читать полностью
              <img src="/assets/icons/chevron_right_green.svg" alt="" width="18" height="18" />
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="modal-overlay is-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__head">
              <div className="modal__titles">
                <h2 className="modal__title">{selected.title}</h2>
                <p className="modal__subtitle">{formatNewsDate(selected.created_at)}</p>
              </div>
              <button className="modal__close" onClick={() => setSelected(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="news-full">{selected.body}</div>
          </div>
        </div>
      )}
    </>
  );
}
