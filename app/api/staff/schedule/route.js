import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session.js';
import { getStaffSchedule, updateScheduleTeacher, setScheduleCancelled } from '@/lib/db.js';
import { crossOriginDenied } from '@/lib/security.js';
import { TEACHERS } from '@/lib/staff.js';

function isStaff(user) {
  return user && user.role === 'staff';
}

export async function GET(req) {
  const user = await getCurrentUser();
  if (!isStaff(user)) {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }
  const url = new URL(req.url);
  const date = (url.searchParams.get('date') || '').slice(0, 10);
  if (!date) return NextResponse.json({ ok: false, error: 'Не указана дата' }, { status: 400 });
  return NextResponse.json({ ok: true, classes: getStaffSchedule(date), teachers: TEACHERS });
}

export async function POST(req) {
  const denied = crossOriginDenied(req);
  if (denied) return denied;

  const user = await getCurrentUser();
  if (!isStaff(user)) {
    return NextResponse.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const group = String(body.group || '').slice(0, 40);
  const date = String(body.date || '').slice(0, 10);
  const time_start = String(body.time_start || '').slice(0, 10);
  const discipline = String(body.discipline || '').slice(0, 200);
  if (!group || !date || !time_start || !discipline) {
    return NextResponse.json({ ok: false, error: 'Некорректные данные' }, { status: 400 });
  }

  if (typeof body.cancelled === 'boolean') {
    setScheduleCancelled(group, date, time_start, discipline, body.cancelled);
  } else if (body.teacher) {
    updateScheduleTeacher(group, date, time_start, discipline, String(body.teacher).slice(0, 100));
  } else {
    return NextResponse.json({ ok: false, error: 'Нет изменений' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
