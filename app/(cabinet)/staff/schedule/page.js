import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { todayISO } from '@/lib/term.js';
import StaffSchedule from '@/components/StaffSchedule.jsx';

function nextStudyDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  while (d.getDay() === 0) d.setDate(d.getDate() + 1); // пропускаем воскресенье
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function StaffSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'staff') redirect('/');

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Расписание</h1>
      </div>
      <StaffSchedule defaultDate={nextStudyDay(todayISO())} />
    </>
  );
}
