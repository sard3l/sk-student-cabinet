import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getChatHistory } from '@/lib/db.js';
import { todayISO, formatDateRu } from '@/lib/term.js';
import AssistantChat from '@/components/AssistantChat.jsx';

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const messages = getChatHistory(user.id);
  const todayLabel = 'Сегодня, ' + formatDateRu(todayISO());

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Помощник</h1>
      </div>
      <AssistantChat name={user.name} todayLabel={todayLabel} initialMessages={messages} />
    </>
  );
}
