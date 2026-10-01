// /campeonato           -> campeonato em destaque
// /campeonato/?c=slug   -> /slug (formato dos links da versão anterior do site)
import { notFound, redirect } from 'next/navigation';
import { getFeaturedSlug } from '@/lib/data/server';

export default async function ChampionshipIndex(props: PageProps<'/campeonato'>) {
  const { c } = await props.searchParams;
  const slug = (typeof c === 'string' && c) || (await getFeaturedSlug());
  if (!slug) notFound();
  redirect(`/${encodeURIComponent(slug)}`);
}
