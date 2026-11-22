import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import Achievements from '@/components/Achievements.jsx';

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Достижения</h1>
      </div>
      <Achievements />
    </>
  );
}
