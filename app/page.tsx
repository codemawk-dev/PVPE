import { Landing } from '@/components/landing/Landing';
import { getSiteData } from '@/lib/data/server';

// Com Supabase, a página é regenerada no máximo a cada 60 s.
export const revalidate = 60;

export default async function HomePage() {
  const data = await getSiteData();
  return <Landing initial={data} />;
}
