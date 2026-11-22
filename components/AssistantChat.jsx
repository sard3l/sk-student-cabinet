'use client';

import { useState, useRef, useEffect } from 'react';

export default function AssistantChat({ name, todayLabel, initialMessages }) {
  const firstName = name.split(/\s+/).pop();
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(prefilled) {
    const q = (prefilled != null ? prefilled : input).trim();
    if (!q || sending) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    if (prefilled == null) setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.reply) {
        setMessages((m) => [...m, data.reply]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="assistant-chat assistant-chat--full">
      <header className="assistant-chat__head">
        <div className="assistant-chat__icon">
          <img src="/assets/icons/assistant-chat.svg" alt="" width="21" height="21" />
        </div>
        <div className="assistant-chat__meta">
          <span className="assistant-chat__title">ИИ-помощник</span>
          <span className="assistant-chat__sub">По учёбе и личному кабинету</span>
        </div>
        <span className="assistant-chat__badge">ИИ</span>
      </header>

      <div className="assistant-chat__messages" ref={messagesRef}>
        <div className="msg-date">{todayLabel}</div>

        <div className="msg">
          <div className="msg__author">Помощник</div>
          <div className="msg__bubble msg__bubble--assistant">
            <div className="msg__body">Привет, {firstName}! Помогу с расписанием, баллами и документами.</div>
          </div>
        </div>

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div className="msg msg--user" key={i}>
              <div className="msg__bubble">{m.text}</div>
            </div>
          ) : (
            <div className="msg" key={i}>
              <div className="msg__author">Помощник</div>
              <div className="msg__bubble msg__bubble--assistant">
                <div className="msg__body">{m.text}</div>
                {m.action_label && (
                  <a className="msg__action" href={m.action_href}>
                    {m.action_label}
                  </a>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <div className="assistant-chat__compose">
        <div className="assistant-input">
          <input
            className="assistant-input__field"
            type="text"
            placeholder="Спросите о расписании, баллах или документах…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="assistant-input__send"
            onClick={() => send()}
            aria-label="Отправить сообщение"
            disabled={sending}
          >
            <img src="/assets/icons/arrow.svg" alt="" width="20" height="20" />
          </button>
        </div>
        <span className="assistant-chat__disclaimer">
          ИИ может ошибаться. Важную информацию уточняйте в учебном офисе.
        </span>
      </div>
    </section>
  );
}
