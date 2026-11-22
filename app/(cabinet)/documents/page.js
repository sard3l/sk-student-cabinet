import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getRequests } from '@/lib/db.js';
import Documents from '@/components/Documents.jsx';

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const requests = getRequests(user.id);

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Документы</h1>
      </div>
      <Documents user={user} requests={requests} />
    </>
  );
}
