'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: fd.get('login'), password: fd.get('password') }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div className="login">
      <div className="login-brand">
        <div className="login-brand__head">
          <img src="/assets/icons/login-cap.svg" alt="" width="30" height="30" />
          <span>Личный кабинет студента</span>
        </div>

        <div className="login-brand__main">
          <div>
            <div className="login-brand__title">
              Вся учёба
              <br />
              под рукой.
            </div>
            <p className="login-brand__sub">
              Расписание, результаты и важные документы — в одном пространстве.
            </p>
          </div>

          <div className="login-brand__features">
            <div className="login-brand__feature">
              <img src="/assets/icons/login-calendar.svg" alt="" width="21" height="21" />
              <span>Расписание и дедлайны</span>
            </div>
            <div className="login-brand__feature">
              <img src="/assets/icons/login-book.svg" alt="" width="21" height="21" />
              <span>Оценки и документы</span>
            </div>
            <div className="login-brand__feature">
              <img src="/assets/icons/login-chat.svg" alt="" width="21" height="21" />
              <span>Помощь в одном чате</span>
            </div>
          </div>
        </div>

        <span className="login-brand__foot">Твой учебный день начинается здесь.</span>
      </div>

      <div className="login-form">
        <form className="login-form__inner" onSubmit={handleSubmit}>
          <div className="login-form__head">
            <span className="login-form__welcome">С возвращением</span>
            <h1 className="login-form__title">Вход в кабинет</h1>
            <p className="login-form__sub">Введите логин и пароль вашей учётной записи.</p>
          </div>

          <div className="login-fields">
            <div className="login-field">
              <label className="login-field__label" htmlFor="loginInput">
                Логин
              </label>
              <div className="login-field__input">
                <input
                  id="loginInput"
                  name="login"
                  type="text"
                  placeholder="Введите логин"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field__label" htmlFor="passInput">
                Пароль
              </label>
              <div className="login-field__input">
                <input
                  id="passInput"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Показать пароль"
                >
                  <img src="/assets/icons/eye.svg" alt="" width="20" height="20" />
                </button>
              </div>
            </div>
          </div>

          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" name="remember" />
              Запомнить меня
            </label>
          </div>

          <button type="submit" className="login-submit">
            Войти
          </button>

          {error && <div className="login-error is-visible">Неверный логин или пароль. Попробуйте ещё раз.</div>}

          <span className="login-concept">
            Концепт для конкурса «Цифровой деканат будущего». Не является официальным сервисом вуза. Все
            данные вымышленные.
          </span>
        </form>
      </div>
    </div>
  );
}
