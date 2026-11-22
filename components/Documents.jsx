'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STUDY_DOCS, DOC_CATEGORIES, findDocBySlug } from '@/lib/study-docs.js';

const TYPES = [
  { key: 'absence', label: 'Справка об отсутствии' },
  { key: 'course', label: 'Курсовая работа' },
  { key: 'vkr', label: 'ВКР' },
  { key: 'plagiarism', label: 'Антиплагиат' },
];

const KIND_TITLE = {
  absence: 'Справка об отсутствии',
  course: 'Курсовая работа',
  vkr: 'Выпускная квалификационная работа',
  plagiarism: 'Проверка на антиплагиат',
};

function statusClass(status) {
  if (status === 'Готово к выдаче' || status === 'Принята' || status === 'Проверена') return 'oh-badge--ready';
  if (status === 'Выполнено') return 'oh-badge--done';
  return 'oh-badge--work';
}

const ALLOWED_EXT = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 МБ

function formatSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' КБ';
  return bytes + ' Б';
}

function formatFileName(safeName) {
  if (!safeName) return '—';
  const idx = safeName.indexOf('-');
  return idx >= 0 ? safeName.slice(idx + 1) : safeName;
}

export default function Documents({ user, requests }) {
  const router = useRouter();
  const [tab, setTab] = useState('order');
  const [uploadType, setUploadType] = useState('absence');
  const [orderFormat, setOrderFormat] = useState('печатный');
  const [orderDone, setOrderDone] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const searchParams = useSearchParams();
  const [openDoc, setOpenDoc] = useState(null);

  // Открытие документа по deep-link из помощника: /documents?doc=<slug>
  useEffect(() => {
    const slug = searchParams.get('doc');
    if (!slug) return;
    const found = findDocBySlug(slug);
    if (found) {
      setOpenDoc(found);
      setTab('study');
    }
  }, [searchParams]);

  const orderRequests = requests.filter((r) => r.kind === 'order');
  const uploadRequests = requests.filter((r) => r.kind === uploadType);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setFileError('Недопустимый формат. Разрешены: PDF, DOCX, JPG, PNG.');
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Файл слишком большой. Максимум 30 МБ.');
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  async function submitOrder(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'order',
        title: fd.get('docType') === 'выписка' ? 'Выписка из приказа' : 'Справка об обучении',
        subject: null,
      }),
    });
    setOrderDone(true);
    router.refresh();
  }

  async function submitUpload(e) {
    e.preventDefault();
    if (!file) {
      setFileError('Прикрепите файл.');
      return;
    }
    const fd = new FormData(e.target);
    const body = new FormData();
    body.append('file', file);
    body.append('kind', uploadType);
    body.append(
      'title',
      (fd.get('title') || KIND_TITLE[uploadType]) + ' · ' + (uploadType === 'course' ? 'версия 2' : 'заявка')
    );
    body.append('subject', fd.get('subject') || '');

    const res = await fetch('/api/upload', { method: 'POST', body });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      setFileError(data.error || 'Ошибка загрузки');
      return;
    }
    setUploadDone(true);
    setFile(null);
    setFileError(null);
    router.refresh();
  }

  return (
    <div className="documents">
      <div className="doc-tabs" role="tablist">
        <button className={'doc-tab' + (tab === 'order' ? ' is-active' : '')} onClick={() => setTab('order')}>
          Заказать документы
        </button>
        <button className={'doc-tab' + (tab === 'upload' ? ' is-active' : '')} onClick={() => setTab('upload')}>
          Загрузка документов
        </button>
        <button className={'doc-tab' + (tab === 'study' ? ' is-active' : '')} onClick={() => setTab('study')}>
          Учёба
        </button>
      </div>

      {tab === 'order' && (
        <>
          <div className="doc-work">
            <section className="doc-form">
            <header>
              <h2>Заказать документ</h2>
              <p className="subtitle">Выберите документ и удобный способ получения.</p>
            </header>

            {!orderDone ? (
              <form onSubmit={submitOrder}>
                <div className="doc-field">
                  <span className="doc-label">Тип документа</span>
                  <div className="doc-options">
                    <label className="doc-option">
                      <input type="radio" name="docType" value="справка" defaultChecked />
                      <span className="doc-option__radio" />
                      <span className="doc-option__label">Справка об обучении</span>
                    </label>
                    <label className="doc-option">
                      <input type="radio" name="docType" value="выписка" />
                      <span className="doc-option__radio" />
                      <span className="doc-option__label">Выписка из приказа</span>
                    </label>
                  </div>
                </div>

                <div className="doc-profile">
                  <span className="doc-profile__label">Данные из профиля</span>
                  <div className="doc-profile__row">
                    <div className="doc-profile__item">
                      <span>Студент</span>
                      <strong>{user.name}</strong>
                    </div>
                    <div className="doc-profile__item">
                      <span>Группа</span>
                      <strong>{user.group_name || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="doc-field">
                  <span className="doc-label">Куда требуется справка?</span>
                  <input
                    className="field__input"
                    type="text"
                    name="purpose"
                    placeholder="Название организации или «По месту требования»"
                  />
                </div>

                <div className="doc-field">
                  <span className="doc-label">Формат получения</span>
                  <div className="doc-options">
                    <label className="doc-option">
                      <input
                        type="radio"
                        name="docFormat"
                        value="электронный"
                        checked={orderFormat === 'электронный'}
                        onChange={() => setOrderFormat('электронный')}
                      />
                      <span className="doc-option__radio" />
                      <span className="doc-option__label">Электронный PDF</span>
                    </label>
                    <label className="doc-option">
                      <input
                        type="radio"
                        name="docFormat"
                        value="печатный"
                        checked={orderFormat === 'печатный'}
                        onChange={() => setOrderFormat('печатный')}
                      />
                      <span className="doc-option__radio" />
                      <span className="doc-option__label">Печатный документ</span>
                    </label>
                  </div>
                </div>

                {orderFormat === 'печатный' && (
                  <div className="doc-field">
                    <span className="doc-label">Место получения</span>
                    <div className="doc-select">
                      <span className="val">Учебный офис · корпус А</span>
                      <span className="chev">⌄</span>
                    </div>
                    <p className="doc-hint">Показывается только для печатного документа.</p>
                  </div>
                )}

                <button type="submit" className="doc-submit">
                  Заказать документ
                </button>
              </form>
            ) : (
              <div className="doc-success is-visible">
                <span className="doc-success__icon">✓</span>
                <div>
                  <h3>Заявка отправлена</h3>
                  <p>Мы пришлём уведомление, когда документ будет готов к получению.</p>
                </div>
              </div>
            )}
          </section>

          <aside className="doc-howto">
            <h2>Как это работает</h2>
            <div className="doc-step">
              <span className="doc-step__num">1</span>
              <div className="doc-step__text">
                <strong>Проверьте данные</strong>
                <p>Имя и группа заполнены из вашего профиля.</p>
              </div>
            </div>
            <div className="doc-step">
              <span className="doc-step__num">2</span>
              <div className="doc-step__text">
                <strong>Выберите формат</strong>
                <p>Электронный документ можно скачать, печатный — забрать в выбранном месте.</p>
              </div>
            </div>
            <div className="doc-step">
              <span className="doc-step__num">3</span>
              <div className="doc-step__text">
                <strong>Дождитесь уведомления</strong>
                <p>Сообщу, когда документ будет готов к получению.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="order-history">
          <div className="order-history__head">
            <h2>История заявок</h2>
            <span>{orderRequests.length} заявки</span>
          </div>
          <div className="oh-scroll">
            <div className="oh-table oh-table--order">
              <div className="oh-row oh-row--head">
                <div className="oh-cell">Дата заявки</div>
                <div className="oh-cell">Тип документа</div>
                <div className="oh-cell">Статус</div>
                <div className="oh-cell">Файл</div>
              </div>
              {orderRequests.map((r) => (
                <div className="oh-row" key={r.id}>
                  <div className="oh-cell">
                    <span className="oh-cell__text">{r.created_at}</span>
                  </div>
                  <div className="oh-cell">
                    <span className="oh-cell__text">{r.title}</span>
                  </div>
                  <div className="oh-cell">
                    <span className={'oh-badge ' + statusClass(r.status)}>
                      {r.status}
                    </span>
                  </div>
                  <div className="oh-cell">
                    {r.result_file ? (
                      <a
                        className="oh-download"
                        href={`/api/requests/${r.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Скачать
                      </a>
                    ) : (
                      <span className="oh-cell__text oh-muted">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      {tab === 'upload' && (
        <>
          <div className="upload-type" role="tablist">
            {TYPES.map((t) => (
              <button
                key={t.key}
                className={'upload-type-btn' + (uploadType === t.key ? ' is-active' : '')}
                onClick={() => {
                  setUploadType(t.key);
                  setUploadDone(false);
                  setFile(null);
                  setFileError(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="doc-work">
            <section className="doc-form">
              <header>
                <h2>{KIND_TITLE[uploadType]}</h2>
                <p className="subtitle">Заполните данные и отправьте на проверку.</p>
              </header>

              {!uploadDone ? (
                <form onSubmit={submitUpload}>
                  <div className="field">
                    <label className="field__label" htmlFor="upTitle">
                      Название *
                    </label>
                    <input
                      className="field__input"
                      id="upTitle"
                      name="title"
                      type="text"
                      defaultValue={uploadType === 'course' ? 'Цифровизация муниципальных услуг' : ''}
                      placeholder="Введите название"
                    />
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="upSubject">
                      Дисциплина
                    </label>
                    <div className="field__select">
                      <select className="field__input" id="upSubject" name="subject">
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

                  <div className="field">
                    <span className="field__label">Файл *</span>
                    <div className="upload-row">
                      <label className="upload-btn">
                        <span>Загрузить файл</span>
                        <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFile} hidden />
                      </label>
                      <span className="upload-hint">PDF, DOCX, JPG, PNG · до 30 МБ</span>
                    </div>
                    {fileError && <span className="doc-error">{fileError}</span>}
                    {file && !fileError && (
                      <div className="upload-file">
                        <span className="upload-file__badge">
                          {(file.name.split('.').pop() || '').toUpperCase()}
                        </span>
                        <div className="upload-file__info">
                          <span className="upload-file__name">{file.name}</span>
                          <span className="upload-file__meta">{formatSize(file.size)} · готово к отправке</span>
                        </div>
                        <button
                          type="button"
                          className="upload-file__remove"
                          onClick={() => setFile(null)}
                          aria-label="Удалить файл"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="upload-row">
                    <button type="submit" className="upload-submit">
                      Отправить на проверку
                    </button>
                    <span className="upload-required">Все поля со * обязательны</span>
                  </div>
                </form>
              ) : (
                <div className="doc-success is-visible">
                  <span className="doc-success__icon">✓</span>
                  <div>
                    <h3>Отправлено</h3>
                    <p>Документ поступил на рассмотрение. Результат придёт в уведомления.</p>
                  </div>
                </div>
              )}
            </section>

            <aside className="doc-howto">
              <h2>Перед отправкой</h2>
              <div className="doc-step">
                <span className="doc-step__num">1</span>
                <div className="doc-step__text">
                  <strong>Проверьте файл</strong>
                  <p>Убедитесь, что загружаете нужный документ — PDF, DOCX или изображение (JPG, PNG).</p>
                </div>
              </div>
              <div className="doc-step">
                <span className="doc-step__num">2</span>
                <div className="doc-step__text">
                  <strong>Проверьте читаемость</strong>
                  <p>На фото или скане должны быть видны все данные документа.</p>
                </div>
              </div>
              <div className="doc-step">
                <span className="doc-step__num">3</span>
                <div className="doc-step__text">
                  <strong>Дождитесь проверки</strong>
                  <p>После отправки документ поступит на рассмотрение. Результат придёт в уведомления.</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="order-history">
            <div className="order-history__head">
              <h2>История загрузок</h2>
              <span>{uploadRequests.length} загрузки</span>
            </div>
            <div className="oh-scroll">
              <div className="oh-table oh-table--upload">
                <div className="oh-row oh-row--head">
                  <div className="oh-cell">Дата</div>
                  <div className="oh-cell">Название</div>
                  <div className="oh-cell">Файл</div>
                  <div className="oh-cell">Статус</div>
                </div>
                {uploadRequests.length === 0 && (
                  <div className="oh-row oh-row--empty">
                    <div className="oh-cell oh-cell--empty">Загрузок пока нет</div>
                  </div>
                )}
                {uploadRequests.map((r) => (
                  <div className="oh-row" key={r.id}>
                    <div className="oh-cell">
                      <span className="oh-cell__text">{r.created_at}</span>
                    </div>
                    <div className="oh-cell">
                      <span className="oh-cell__text">{r.title}</span>
                    </div>
                    <div className="oh-cell">
                      <span className="oh-cell__text">{formatFileName(r.file_name)}</span>
                    </div>
                    <div className="oh-cell">
                      <span className={'oh-badge ' + statusClass(r.status)}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'study' && (
        <div className="study-catalog">
          <div className="study-head">
            <h2>Учебные документы</h2>
            <p>Программы, приказы и правила — всё для учёбы в одном месте.</p>
          </div>
          <div className="study-cats">
            {DOC_CATEGORIES.map((cat) => (
              <section className="study-cat" key={cat}>
                <h3 className="study-cat__title">{cat}</h3>
                {STUDY_DOCS.filter((d) => d.category === cat).map((d) => (
                  <div className="study-doc" key={d.slug}>
                    <span className="study-doc__badge">PDF</span>
                    <div className="study-doc__info">
                      <span className="study-doc__name">{d.title}</span>
                      <span className="study-doc__desc">{d.summary}</span>
                    </div>
                    <a
                      className="study-doc__open"
                      href={`/docs/${d.slug}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Открыть ↗
                    </a>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      )}

      {openDoc && (
        <div
          className="modal-overlay is-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenDoc(null);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__head">
              <div className="modal__titles">
                <h2 className="modal__title">{openDoc.title}</h2>
                <p className="modal__subtitle">{openDoc.category}</p>
              </div>
              <button className="modal__close" onClick={() => setOpenDoc(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="study-full">
              {openDoc.sections.map((s) => (
                <div className="study-full__section" key={s.heading}>
                  <h3 className="study-full__heading">{s.heading}</h3>
                  <p className="study-full__text">{s.text}</p>
                </div>
              ))}
              <a
                className="study-full__pdf"
                href={`/docs/${openDoc.slug}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Скачать PDF ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
