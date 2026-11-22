import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getGroupMembers, getDisciplines } from '@/lib/db.js';
import { todayISO, formatDateRu } from '@/lib/term.js';
import StarostaPanel from '@/components/StarostaPanel.jsx';

export default async function StarostaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (Number(user.is_starosta) !== 1) redirect('/');

  const members = getGroupMembers(user.group_name);
  const disciplines = getDisciplines(user.id).map((d) => d.name);
  const today = todayISO();

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Староста</h1>
      </div>
      <StarostaPanel
        group={user.group_name}
        members={members}
        disciplines={disciplines}
        today={today}
        todayLabel={formatDateRu(today)}
      />
    </>
  );
}
