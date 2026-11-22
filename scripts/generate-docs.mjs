// Генерирует PDF-версии учебных документов из lib/study-docs.js
// Запуск: node scripts/generate-docs.mjs
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { STUDY_DOCS } from '../lib/study-docs.js';

const OUT = path.join(process.cwd(), 'public', 'docs');
fs.mkdirSync(OUT, { recursive: true });

const FONTS = {
  regular: path.join(process.cwd(), 'scripts', 'fonts', 'Inter-Regular.ttf'),
  medium: path.join(process.cwd(), 'scripts', 'fonts', 'Inter-Medium.ttf'),
  bold: path.join(process.cwd(), 'scripts', 'fonts', 'Inter-Bold.ttf'),
};

for (const doc of STUDY_DOCS) {
  const pdf = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: doc.title,
      Author: 'СК — Студенческий кабинет (концепт)',
      Subject: doc.category,
    },
  });

  pdf.registerFont('Regular', FONTS.regular);
  pdf.registerFont('Medium', FONTS.medium);
  pdf.registerFont('Bold', FONTS.bold);

  const file = path.join(OUT, `${doc.slug}.pdf`);
  const stream = fs.createWriteStream(file);
  pdf.pipe(stream);

  pdf.font('Bold').fontSize(20).fillColor('#20382a').text(doc.title);
  pdf.moveDown(0.25);
  pdf.font('Medium').fontSize(11).fillColor('#68796e').text(doc.category);
  pdf.moveDown(1);

  for (const sec of doc.sections) {
    pdf.font('Bold').fontSize(13).fillColor('#24533a').text(sec.heading);
    pdf.moveDown(0.25);
    pdf.font('Regular').fontSize(11).fillColor('#20382a').text(sec.text, {
      align: 'justify',
      lineGap: 3,
    });
    pdf.moveDown(0.9);
  }

  pdf.moveDown(1);
  pdf
    .font('Regular')
    .fontSize(8)
    .fillColor('#88958c')
    .text(
      'Концепт для конкурса «Цифровой деканат будущего». Не является официальным сервисом вуза. Все данные вымышленные.',
      { align: 'left' }
    );

  pdf.end();
  await new Promise((resolve) => stream.on('finish', resolve));
  console.log('ok:', `${doc.slug}.pdf`);
}
