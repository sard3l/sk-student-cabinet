import { getDisciplines, getGradebookSemesters } from '@/lib/db.js';
import { getCurrentUser } from '@/lib/session.js';
import { redirect } from 'next/navigation';
import { TERM_DATES } from '@/lib/term.js';
import GradesJournal from '@/components/GradesJournal.jsx';

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const disciplines = getDisciplines(user.id);
  const pastSemesters = getGradebookSemesters(user.id);

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Успеваемость</h1>
      </div>
      <GradesJournal disciplines={disciplines} dates={TERM_DATES} pastSemesters={pastSemesters} />
    </>
  );
}
