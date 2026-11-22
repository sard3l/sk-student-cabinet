import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword, newToken, hashToken } from './auth.js';
import { TERM_DATES } from './term.js';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

let _db = null;

function schema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT,
      program TEXT,
      course TEXT,
      group_name TEXT,
      is_starosta INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_start TEXT,
      time_end TEXT,
      discipline TEXT,
      teacher TEXT,
      room TEXT,
      type TEXT,
      cancelled INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS disciplines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT,
      teacher TEXT,
      total INTEGER,
      marks TEXT
    );

    CREATE TABLE IF NOT EXISTS gradebook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      semester TEXT,
      discipline TEXT,
      form TEXT,
      result TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT,
      title TEXT,
      subject TEXT,
      status TEXT DEFAULT 'На рассмотрении',
      comment TEXT,
      created_at TEXT,
      file_name TEXT,
      file_size INTEGER,
      result_file TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      subject TEXT,
      due TEXT,
      due_time TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT,
      icon TEXT,
      title TEXT,
      body TEXT,
      read INTEGER DEFAULT 0,
      time_label TEXT,
      requires_action INTEGER DEFAULT 0,
      action_label TEXT,
      action_meta TEXT
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      summary TEXT,
      body TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      action_label TEXT,
      action_href TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id INTEGER,
      position INTEGER
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      date TEXT NOT NULL,
      discipline TEXT NOT NULL DEFAULT '',
      member_id INTEGER NOT NULL,
      present INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER,
      UNIQUE (group_name, date, discipline, member_id)
    );
  `);
}

// --- генераторы синтетических данных ---

// marks: детерминированная последовательность по всем учебным дням семестра
function generateMarks(seed) {
  const marks = [];
  for (let i = 0; i < TERM_DATES.length; i++) {
    const v = (i * 7 + seed * 13 + seed) % 47;
    if (v < 40) marks.push(null);
    else if (v === 40) marks.push('н');
    else marks.push(5 + (v % 6)); // 5..10
  }
  return marks;
}

function sumMarks(marks) {
  return marks.reduce((a, m) => (typeof m === 'number' ? a + m : a), 0);
}

// pattern: [день недели 0=пн..5=сб, начало, конец, дисциплина, преподаватель, ауд., тип]
function generateSchedule(db, userId, pattern) {
  const ins = db.prepare(
    'INSERT INTO schedule (user_id, date, time_start, time_end, discipline, teacher, room, type) VALUES (?,?,?,?,?,?,?,?)'
  );
  for (const d of TERM_DATES) {
    const dayIdx = d.dow === 0 ? -1 : d.dow - 1; // 0=пн..5=сб
    if (dayIdx < 0 || dayIdx > 5) continue;
    for (const p of pattern) {
      if (p[0] === dayIdx) {
        ins.run(userId, d.date, p[1], p[2], p[3], p[4], p[5], p[6]);
      }
    }
  }
}

const SEMESTERS = [
  '1 семестр · 2023/24',
  '2 семестр · 2023/24',
  '1 семестр · 2024/25',
  '2 семестр · 2024/25',
  '1 семестр · 2025/26',
  '2 семестр · 2025/26',
];

function generateGradebook(db, userId, pool, baseSeed) {
  const ins = db.prepare(
    'INSERT INTO gradebook (user_id, semester, discipline, form, result) VALUES (?,?,?,?,?)'
  );
  SEMESTERS.forEach((sem, si) => {
    for (let j = 0; j < 7; j++) {
      const disc = pool[(si * 7 + j) % pool.length];
      const r = (si * 7 + j + baseSeed) % 5;
      const form = r === 4 ? 'Зачёт' : 'Экзамен';
      let result;
      if (form === 'Зачёт') {
        result = (si * 7 + j + baseSeed) % 11 === 0 ? 'Незачёт' : 'Зачёт';
      } else {
        result = String(62 + ((si * 7 + j) * 3 + baseSeed * 5) % 34); // 62..95
      }
      ins.run(userId, sem, disc, form, result);
    }
  });
}

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (login, password_hash, role, name, faculty, program, course, group_name, is_starosta) VALUES (?,?,?,?,?,?,?,?,?)'
  );

  const ivanov = insertUser.run(
    'ivanov', hashPassword('student1'), 'student', 'Иванов Иван',
    'Институт экономики и управления', 'Менеджмент', '2 курс', 'ГМУ-777', 0
  ).lastInsertRowid;

  // Ветрова — староста группы ГМУ-777 (одна группа с Ивановым)
  const vetrova = insertUser.run(
    'vetrova', hashPassword('student2'), 'student', 'Ветрова Алиса',
    'Институт экономики и управления', 'Менеджмент', '2 курс', 'ГМУ-777', 1
  ).lastInsertRowid;

  // Одногруппник Ветровой — чтобы проверить рассылку «всем одногруппникам»
  const sidorov = insertUser.run(
    'sidorov', hashPassword('student3'), 'student', 'Сидоров Пётр',
    'Институт цифровых технологий', 'Программная инженерия', '2 курс', 'ПИ-22-1', 0
  ).lastInsertRowid;

  insertUser.run(
    'lebedeva', hashPassword('staff1'), 'staff', 'Мария Лебедева', null, null, null, null, 0
  );

  // --- Состав группы ГМУ-777 (20 человек) ---
  const insMember = db.prepare(
    'INSERT INTO group_members (group_name, name, user_id, position) VALUES (?,?,?,?)'
  );
  const groupNames = [
    'Иванов Иван',
    'Ветрова Алиса',
    'Алексеев Максим',
    'Белова Дарья',
    'Волков Артём',
    'Громова Екатерина',
    'Дмитриев Никита',
    'Егорова Софья',
    'Жуков Михаил',
    'Зайцева Анна',
    'Ильин Сергей',
    'Козлова Мария',
    'Лебедев Андрей',
    'Морозова Полина',
    'Носов Илья',
    'Орлова Виктория',
    'Павлов Денис',
    'Романова Елена',
    'Соколов Кирилл',
    'Тихонова Алина',
  ];
  const memberUserId = { 'Иванов Иван': ivanov, 'Ветрова Алиса': vetrova };
  groupNames.forEach((name, i) => insMember.run('ГМУ-777', name, memberUserId[name] || null, i + 1));

  // --- Расписание (сентябрь–декабрь) ---
  const pattern1 = [
    [0, '09:00', '10:30', 'Экономическая теория', 'Иванова Е. А.', 'ауд. 304', 'Лекция'],
    [0, '11:00', '12:30', 'Иностранный язык', 'Смирнова О. В.', 'ауд. 212', 'Семинар'],
    [0, '14:00', '15:30', 'Правоведение', 'Петров А. В.', 'ауд. 108', 'Лекция'],
    [1, '08:30', '10:00', 'История России', 'Волков И. Н.', 'ауд. 405', 'Лекция'],
    [1, '10:30', '12:00', 'Математика', 'Соколова М. А.', 'ауд. 302', 'Семинар'],
    [1, '13:00', '14:30', 'Менеджмент', 'Орлов Д. С.', 'ауд. 201', 'Лекция'],
    [2, '09:00', '10:30', 'Экономическая теория', 'Иванова Е. А.', 'ауд. 304', 'Семинар'],
    [2, '11:00', '12:30', 'Информатика', 'Кузнецов Р. В.', 'ауд. 110', 'Лекция'],
    [3, '08:30', '10:00', 'Математика', 'Соколова М. А.', 'ауд. 302', 'Лекция'],
    [3, '11:00', '12:30', 'Правоведение', 'Петров А. В.', 'ауд. 108', 'Семинар'],
    [3, '14:00', '15:30', 'Иностранный язык', 'Смирнова О. В.', 'ауд. 212', 'Семинар'],
    [4, '09:00', '10:30', 'Менеджмент', 'Орлов Д. С.', 'ауд. 201', 'Семинар'],
    [4, '11:00', '12:30', 'Информатика', 'Кузнецов Р. В.', 'ауд. 110', 'Семинар'],
    [5, '09:00', '10:30', 'История России', 'Волков И. Н.', 'ауд. 405', 'Семинар'],
  ];
  generateSchedule(db, ivanov, pattern1);

  const pattern2 = [
    [0, '09:00', '10:30', 'Алгоритмы и структуры данных', 'Ким О. Ю.', 'ауд. 220', 'Лекция'],
    [0, '11:00', '12:30', 'Базы данных', 'Новиков П. А.', 'ауд. 305', 'Практика'],
    [1, '10:45', '12:15', 'Английский язык', 'Фролова И. В.', 'ауд. 118', 'Семинар'],
    [1, '13:00', '14:30', 'Программирование', 'Гусев А. А.', 'ауд. 204', 'Лекция'],
    [2, '09:00', '10:30', 'Алгоритмы и структуры данных', 'Ким О. Ю.', 'ауд. 220', 'Практика'],
    [2, '11:00', '12:30', 'Операционные системы', 'Сидоров М. С.', 'ауд. 212', 'Лекция'],
    [3, '10:45', '12:15', 'Базы данных', 'Новиков П. А.', 'ауд. 305', 'Лекция'],
    [3, '13:00', '14:30', 'Дискретная математика', 'Лебедева А. В.', 'ауд. 310', 'Семинар'],
    [4, '09:00', '10:30', 'Программирование', 'Гусев А. А.', 'ауд. 204', 'Практика'],
    [5, '11:00', '12:30', 'Английский язык', 'Фролова И. В.', 'ауд. 118', 'Семинар'],
  ];
  generateSchedule(db, vetrova, pattern1);
  generateSchedule(db, sidorov, pattern2);

  // --- Дисциплины (баллы за весь период) ---
  const insDisc = db.prepare(
    'INSERT INTO disciplines (user_id, name, teacher, total, marks) VALUES (?,?,?,?,?)'
  );
  const discs1 = [
    ['Экономическая теория', 'Иванова Е. А.'],
    ['Математика', 'Соколова М. А.'],
    ['Информатика', 'Кузнецов Р. В.'],
    ['История России', 'Волков И. Н.'],
    ['Иностранный язык', 'Смирнова О. В.'],
    ['Правоведение', 'Петров А. В.'],
    ['Менеджмент', 'Орлов Д. С.'],
  ];
  discs1.forEach((d, i) => {
    const marks = generateMarks(i + 1);
    insDisc.run(ivanov, d[0], d[1], sumMarks(marks), JSON.stringify(marks));
  });

  const discs2 = [
    ['Алгоритмы и структуры данных', 'Ким О. Ю.'],
    ['Базы данных', 'Новиков П. А.'],
    ['Программирование', 'Гусев А. А.'],
    ['Операционные системы', 'Сидоров М. С.'],
    ['Английский язык', 'Фролова И. В.'],
    ['Дискретная математика', 'Лебедева А. В.'],
    ['Физика', 'Иванов С. П.'],
  ];
  discs1.forEach((d, i) => {
    const marks = generateMarks(i + 41);
    insDisc.run(vetrova, d[0], d[1], sumMarks(marks), JSON.stringify(marks));
  });
  discs2.forEach((d, i) => {
    const marks = generateMarks(i + 31);
    insDisc.run(sidorov, d[0], d[1], sumMarks(marks), JSON.stringify(marks));
  });

  // --- Зачётная книжка (3 прошлых года = 6 семестров) ---
  const pool1 = [
    'Экономическая теория', 'Математика', 'Информатика', 'История России', 'Иностранный язык',
    'Правоведение', 'Менеджмент', 'Микроэкономика', 'Макроэкономика', 'Статистика',
    'Маркетинг', 'Финансы', 'Бухгалтерский учёт', 'Управление персоналом', 'Логистика',
    'Экономика предприятия', 'Финансовый менеджмент', 'Стратегический менеджмент',
    'Управление проектами', 'Основы управленческой деятельности', 'Гражданское право', 'Финтех',
  ];
  generateGradebook(db, ivanov, pool1, 1);

  const pool2 = [
    'Алгоритмы и структуры данных', 'Базы данных', 'Программирование', 'Операционные системы',
    'Английский язык', 'Дискретная математика', 'Физика', 'Математический анализ',
    'Компьютерные сети', 'Веб-разработка', 'Теория вероятностей', 'Линейная алгебра',
    'Архитектура ЭВМ', 'Объектно-ориентированное программирование', 'Компьютерная графика',
    'Машинное обучение', 'Криптография', 'Тестирование ПО', 'Мобильная разработка', 'DevOps',
  ];
  generateGradebook(db, vetrova, pool1, 7);
  generateGradebook(db, sidorov, pool2, 13);

  // --- Заявки ---
  const insReq = db.prepare(
    'INSERT INTO requests (user_id, kind, title, subject, status, comment, created_at) VALUES (?,?,?,?,?,?,?)'
  );
  insReq.run(ivanov, 'absence', 'Справка об отсутствии · 09–10.11', 'История России', 'Нужно исправить', 'Не видна печать. Загрузите новый скан.', '11.11.2026');
  insReq.run(ivanov, 'absence', 'Справка об отсутствии · 03–05.11', 'История России', 'Принята', 'Отсутствие подтверждено.', '06.11.2026');
  insReq.run(ivanov, 'course', 'Курсовая работа · версия 1', 'Менеджмент', 'На доработке', 'Добавьте отзыв руководителя', '19.11.2026');
  insReq.run(ivanov, 'order', 'Справка об обучении', null, 'В работе', null, '22.11.2026');
  insReq.run(ivanov, 'order', 'Выписка из приказа', null, 'Готово к выдаче', null, '19.11.2026');
  insReq.run(ivanov, 'order', 'Справка об обучении', null, 'Выполнено', null, '12.11.2026');
  insReq.run(vetrova, 'course', 'Курсовая работа · версия 1', 'Менеджмент', 'Принята', 'Работа принята', '18.11.2026');
  insReq.run(vetrova, 'plagiarism', 'Проверка на антиплагиат', 'Экономическая теория', 'Проверена', null, '17.11.2026');
  insReq.run(vetrova, 'order', 'Справка об обучении', null, 'Выполнено', null, '15.11.2026');
  insReq.run(vetrova, 'order', 'Справка об обучении', null, 'В работе', null, '21.11.2026');

  // --- Заметки ---
  const insNote = db.prepare('INSERT INTO notes (user_id, text, created_at) VALUES (?,?,?)');
  insNote.run(ivanov, 'Подготовиться к семинару по физике', '21.11.2026');
  insNote.run(ivanov, 'Отправить курсовую на проверку', '20.11.2026');
  insNote.run(vetrova, 'Подготовить отчёт по практике', '21.11.2026');
  insNote.run(vetrova, 'Записаться на курсы по английскому', '19.11.2026');

  // --- Дедлайны ---
  const insDl = db.prepare('INSERT INTO deadlines (user_id, title, subject, due, due_time) VALUES (?,?,?,?,?)');
  insDl.run(ivanov, 'Эссе по истории', 'История России', '21 ноя', '23:59');
  insDl.run(ivanov, 'Практическая работа № 3', 'Информатика', '23 ноя', '18:00');
  insDl.run(ivanov, 'Доклад по менеджменту', 'Менеджмент', '25 ноя', '12:00');
  insDl.run(vetrova, 'Лабораторная № 2', 'Базы данных', '22 ноя', '20:00');
  insDl.run(vetrova, 'Курсовая · черновик', 'Программирование', '24 ноя', '18:00');
  insDl.run(vetrova, 'Контрольная по физике', 'Физика', '26 ноя', '10:00');

  // --- Уведомления ---
  const insNotif = db.prepare(
    'INSERT INTO notifications (user_id, type, icon, title, body, read, time_label, requires_action, action_label, action_meta) VALUES (?,?,?,?,?,?,?,?,?,?)'
  );
  const notif1 = [
    ['deadline', 'notif-clock', 'Завтра заканчивается срок сдачи', 'Практическая работа № 3 · Информатика. Сдать до 23 ноября, 18:00.', 0, 'Сегодня · 10:05', 1, 'Открыть дедлайн', 'Завтра, 23 ноября · 18:00'],
    ['study', 'notif-edit', 'Курсовая возвращена на доработку', 'Уточните выводы и добавьте источники за 2024–2026 годы.', 0, '20 ноября · 14:20', 1, 'Загрузить версию', 'Курсовая работа · версия 1'],
    ['documents', 'notif-file', 'Для справки нужен новый скан', 'Отсутствие 09–10 ноября. Не видна печать — загрузите новый скан.', 0, '11 ноября · 12:10', 1, 'Исправить справку', 'Нужно исправить'],
    ['achievements', 'notif-trophy', 'Открыто достижение «Бумажный ниндзя»', 'Первый документ получен. Награда добавлена в вашу коллекцию.', 0, '21 ноября · 17:40', 0, 'Смотреть награду →', null],
    ['study', 'notif-chart', 'Начислены баллы по информатике', 'За занятие 20 ноября — 8 баллов. Всего по дисциплине — 42 балла.', 1, '20 ноября · 09:30', 0, 'Открыть успеваемость →', null],
    ['study', 'notif-check', 'Проверка на антиплагиат завершена', 'Курсовая_Иванов_v1.docx · отчёт готов к просмотру.', 0, '18 ноября · 18:20', 0, 'Открыть отчёт →', null],
  ];
  for (const n of notif1) insNotif.run(ivanov, ...n);

  const notif2 = [
    ['deadline', 'notif-clock', 'Срок сдачи лабораторной завтра', 'Лабораторная № 2 · Базы данных. Сдать до 22 ноября, 20:00.', 0, 'Сегодня · 09:15', 1, 'Открыть дедлайн', 'Завтра, 22 ноября · 20:00'],
    ['study', 'notif-edit', 'Курсовая принята', 'Курсовая работа по базам данных принята руководителем.', 0, '18 ноября · 16:00', 0, 'Открыть работу →', null],
    ['documents', 'notif-file', 'Справка готова к выдаче', 'Справка об обучении готова. Заберите в учебном офисе.', 0, '17 ноября · 11:30', 1, 'Забрать документ', 'Учебный офис · корпус А'],
    ['achievements', 'notif-trophy', 'Открыто достижение «Первый десяток»', 'Набраны первые 10 баллов по дисциплине.', 1, '15 ноября · 18:00', 0, 'Смотреть награду →', null],
    ['study', 'notif-chart', 'Начислены баллы по программированию', 'За занятие — 9 баллов. Всего — 84 балла.', 1, '19 ноября · 10:00', 0, 'Открыть успеваемость →', null],
    ['study', 'notif-check', 'Изменение в расписании', 'Пара по операционным системам перенесена на четверг.', 0, '16 ноября · 14:00', 0, null, null],
  ];
  for (const n of notif2) insNotif.run(vetrova, ...n);

  // --- Новости ---
  const insNews = db.prepare('INSERT INTO news (title, summary, body, created_at) VALUES (?,?,?,?)');
  insNews.run(
    'Вышел приказ о закреплении тем ВКР',
    'Ректор подписал приказ о закреплении тем и научных руководителей за студентами.',
    'Ректор университета подписал приказ о закреплении тем выпускных квалификационных работ и научных руководителей за студентами 3–4 курсов.\n\nТемы закреплены за кафедрами в соответствии с заявками. Если у вас есть замечания или вы хотите изменить тему — обратитесь на кафедру до 1 декабря.\n\nС полным списком можно ознакомиться в разделе «Документы» → «Учёба».',
    '21.11.2026'
  );
  insNews.run(
    'Наши студенты на олимпиаде',
    'Студенты нашего университета заняли первое место на международной олимпиаде по искусственному интеллекту.',
    'Команда университета одержала победу на международной олимпиаде по искусственному интеллекту, которая прошла в эти выходные.\n\nНаши студенты обошли 40 команд из 15 стран в задаче по машинному обучению. Поздравляем ребят и их научного руководителя!',
    '20.11.2026'
  );
  insNews.run(
    'Победа футбольной команды',
    'Футбольная команда университета выиграла московские студенческие соревнования.',
    'Сборная университета по футболу заняла первое место в московских студенческих соревнованиях.\n\nВ финальном матче команда обыграла соперников со счётом 3:1. Следующий матч состоится в субботу — приходите поддержать ребят!',
    '19.11.2026'
  );
  insNews.run(
    'День открытых дверей',
    'Приглашаем абитуриентов и их родителей на день открытых дверей университета.',
    '28 ноября в главном корпусе пройдёт день открытых дверей.\n\nГостей ждут экскурсии по кампусу, встречи с преподавателями и презентации образовательных программ. Начало в 11:00, вход свободный.',
    '18.11.2026'
  );
  insNews.run(
    'Обновление расписания на декабрь',
    'В расписании занятий появились изменения на декабрь — проверьте свой календарь.',
    'На декабрь внесены изменения в расписание: часть занятий перенесена на другие аудитории, а также добавлены консультации перед сессией.\n\nАктуальное расписание уже доступно в разделе «Календарь». Убедитесь, что вы проверили свою группу.',
    '17.11.2026'
  );
  insNews.run(
    'Стипендия за достижения',
    'Объявлен приём заявок на повышенную стипендию за учебные и научные достижения.',
    'Открыт приём заявок на повышенную государственную академическую стипендию.\n\nПретендовать могут студенты с высокими баллами, научными публикациями, победами в олимпиадах и активным участием в жизни университета. Заявки принимаются до 5 декабря в учебном офисе.',
    '16.11.2026'
  );
}

export function getDb() {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  schema(_db);
  seed(_db);
  return _db;
}

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export function createSession(userId) {
  const db = getDb();
  const token = newToken();
  const expiresAt = Date.now() + SESSION_TTL;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)').run(
    hashToken(token),
    userId,
    expiresAt
  );
  return { token, expiresAt };
}

export function getUserByToken(token) {
  if (!token) return null;
  const db = getDb();
  const tokenHash = hashToken(token);
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(tokenHash);
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenHash);
    return null;
  }
  const u = db.prepare('SELECT id, login, role, name, faculty, program, course, group_name, is_starosta FROM users WHERE id = ?').get(row.user_id);
  return u ? { ...u } : null;
}

export function deleteSession(token) {
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(hashToken(token));
}

export function getSchedule(userId) {
  return getDb()
    .prepare('SELECT * FROM schedule WHERE user_id = ? ORDER BY date, time_start')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function getScheduleBetween(userId, from, to) {
  return getDb()
    .prepare('SELECT * FROM schedule WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date, time_start')
    .all(userId, from, to)
    .map((r) => ({ ...r }));
}

export function getDisciplines(userId) {
  const rows = getDb().prepare('SELECT * FROM disciplines WHERE user_id = ? ORDER BY id').all(userId);
  return rows.map((r) => ({ ...r, marks: JSON.parse(r.marks || '[]') }));
}

export function getGradebook(userId) {
  return getDb()
    .prepare('SELECT * FROM gradebook WHERE user_id = ? ORDER BY id')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function getGradebookSemesters(userId) {
  const rows = getDb()
    .prepare('SELECT DISTINCT semester FROM gradebook WHERE user_id = ? ORDER BY id')
    .all(userId);
  return rows.map((r) => r.semester);
}

export function getRequests(userId) {
  return getDb()
    .prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function getAllRequests() {
  return getDb()
    .prepare(
      `SELECT r.*, u.name AS user_name, u.group_name FROM requests r
       JOIN users u ON u.id = r.user_id ORDER BY r.id DESC`
    )
    .all()
    .map((r) => ({ ...r }));
}

export function createRequest(userId, data) {
  const db = getDb();
  const now = new Date().toLocaleDateString('ru-RU');
  const info = db
    .prepare(
      'INSERT INTO requests (user_id, kind, title, subject, status, created_at, file_name, file_size) VALUES (?,?,?,?,?,?,?,?)'
    )
    .run(userId, data.kind, data.title, data.subject || null, 'На рассмотрении', now, data.file_name || null, data.file_size || null);
  return { ...db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid) };
}

export function updateRequestStatus(id, status, comment) {
  const db = getDb();
  db.prepare('UPDATE requests SET status = ?, comment = ? WHERE id = ?').run(status, comment || null, id);
  return { ...db.prepare('SELECT * FROM requests WHERE id = ?').get(id) };
}

export function getRequestById(id) {
  const row = getDb().prepare('SELECT * FROM requests WHERE id = ?').get(id);
  return row ? { ...row } : null;
}

export function setRequestResult(id, fileName) {
  const db = getDb();
  db.prepare("UPDATE requests SET result_file = ?, status = 'Готово' WHERE id = ?").run(fileName, id);
  return { ...db.prepare('SELECT * FROM requests WHERE id = ?').get(id) };
}

// --- Расписание для сотрудника ---

export function getStaffSchedule(date) {
  return getDb()
    .prepare(
      `SELECT u.group_name AS group_name,
              s.date, s.time_start, s.time_end, s.discipline,
              MAX(s.teacher) AS teacher, MAX(s.room) AS room, MAX(s.type) AS type,
              MAX(s.cancelled) AS cancelled
       FROM schedule s
       JOIN users u ON u.id = s.user_id
       WHERE s.date = ?
       GROUP BY u.group_name, s.date, s.time_start, s.time_end, s.discipline
       ORDER BY s.time_start, u.group_name`
    )
    .all(date)
    .map((r) => ({ ...r }));
}

export function updateScheduleTeacher(groupName, date, timeStart, discipline, teacher) {
  getDb()
    .prepare(
      `UPDATE schedule SET teacher = ?
       WHERE date = ? AND time_start = ? AND discipline = ?
         AND user_id IN (SELECT id FROM users WHERE group_name = ?)`
    )
    .run(teacher, date, timeStart, discipline, groupName);
}

export function setScheduleCancelled(groupName, date, timeStart, discipline, cancelled) {
  getDb()
    .prepare(
      `UPDATE schedule SET cancelled = ?
       WHERE date = ? AND time_start = ? AND discipline = ?
         AND user_id IN (SELECT id FROM users WHERE group_name = ?)`
    )
    .run(cancelled ? 1 : 0, date, timeStart, discipline, groupName);
}

export function getNotes(userId) {
  return getDb()
    .prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function addNote(userId, text) {
  const db = getDb();
  const now = new Date().toLocaleDateString('ru-RU');
  const info = db.prepare('INSERT INTO notes (user_id, text, created_at) VALUES (?,?,?)').run(userId, text, now);
  return { ...db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid) };
}

export function deleteNote(userId, id) {
  getDb().prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId);
}

// --- Группа и посещаемость (староста) ---

export function getGroupMembers(groupName) {
  return getDb()
    .prepare('SELECT id, name, user_id, position FROM group_members WHERE group_name = ? ORDER BY position, id')
    .all(groupName)
    .map((r) => ({ ...r }));
}

export function getAttendance(groupName, date, discipline) {
  const rows = getDb()
    .prepare('SELECT member_id, present FROM attendance WHERE group_name = ? AND date = ? AND discipline = ?')
    .all(groupName, date, discipline);
  const map = {};
  for (const r of rows) map[r.member_id] = r.present;
  return map;
}

export function saveAttendance(groupName, date, discipline, marks) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO attendance (group_name, date, discipline, member_id, present, updated_at) VALUES (?,?,?,?,?,?)'
  );
  const now = Date.now();
  for (const m of marks) {
    stmt.run(groupName, date, discipline, m.memberId, m.present ? 1 : 0, now);
  }
}

export function getUsersByGroup(groupName) {
  return getDb()
    .prepare('SELECT id, name FROM users WHERE group_name = ?')
    .all(groupName)
    .map((r) => ({ ...r }));
}

export function addGroupDeadline(groupName, data) {
  const db = getDb();
  const users = getUsersByGroup(groupName);
  const insDeadline = db.prepare(
    'INSERT INTO deadlines (user_id, title, subject, due, due_time) VALUES (?,?,?,?,?)'
  );
  const insNotif = db.prepare(
    'INSERT INTO notifications (user_id, type, icon, title, body, read, time_label, requires_action) VALUES (?,?,?,?,?,?,?,?)'
  );
  for (const u of users) {
    insDeadline.run(u.id, data.title, data.subject || 'Староста', data.due, data.due_time || null);
    insNotif.run(
      u.id,
      'deadline',
      'notif-clock',
      'Новый дедлайн от старосты',
      `${data.title} · ${data.due}${data.due_time ? ' ' + data.due_time : ''}`,
      0,
      'только что',
      0
    );
  }
  return users.length;
}

export function addGroupNotification(groupName, text) {
  const db = getDb();
  const users = getUsersByGroup(groupName);
  const insNotif = db.prepare(
    'INSERT INTO notifications (user_id, type, icon, title, body, read, time_label, requires_action) VALUES (?,?,?,?,?,?,?,?)'
  );
  for (const u of users) {
    insNotif.run(u.id, 'message', 'notif-edit', 'Сообщение от старосты', text, 0, 'только что', 0);
  }
  return users.length;
}

export function getDeadlines(userId) {
  return getDb()
    .prepare('SELECT * FROM deadlines WHERE user_id = ? ORDER BY id')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function addDeadline(userId, data) {
  const db = getDb();
  const info = db
    .prepare('INSERT INTO deadlines (user_id, title, subject, due, due_time) VALUES (?,?,?,?,?)')
    .run(userId, data.title, data.subject || null, data.due || null, data.due_time || null);
  return { ...db.prepare('SELECT * FROM deadlines WHERE id = ?').get(info.lastInsertRowid) };
}

export function getNotifications(userId) {
  return getDb()
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC')
    .all(userId)
    .map((r) => ({ ...r, read: !!r.read }));
}

export function markNotificationsRead(userId) {
  getDb().prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
}

export function getNews() {
  return getDb()
    .prepare('SELECT * FROM news ORDER BY id DESC')
    .all()
    .map((r) => ({ ...r }));
}

const CHAT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 дней

export function getChatHistory(userId) {
  const db = getDb();
  const cutoff = Date.now() - CHAT_TTL;
  // удаляем сообщения старше 7 дней
  db.prepare('DELETE FROM chat_messages WHERE user_id = ? AND created_at < ?').run(userId, cutoff);
  return db
    .prepare('SELECT id, role, text, action_label, action_href, created_at FROM chat_messages WHERE user_id = ? ORDER BY id ASC')
    .all(userId)
    .map((r) => ({ ...r }));
}

export function saveChatMessage(userId, role, text, actionLabel, actionHref) {
  const db = getDb();
  const info = db
    .prepare('INSERT INTO chat_messages (user_id, role, text, action_label, action_href, created_at) VALUES (?,?,?,?,?,?)')
    .run(userId, role, text, actionLabel || null, actionHref || null, Date.now());
  return { ...db.prepare('SELECT id, role, text, action_label, action_href, created_at FROM chat_messages WHERE id = ?').get(info.lastInsertRowid) };
}
