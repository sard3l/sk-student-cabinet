import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getNews } from '@/lib/db.js';
import NewsCenter from '@/components/NewsCenter.jsx';

export default async function NewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const news = getNews();

  return (
    <>
      <div className="content__top">
        <h1 className="content__title">Новости</h1>
      </div>
      <NewsCenter news={news} />
    </>
  );
}
