// Página de qualquer campeonato cadastrado no painel: /copa-do-mel, /copa-de-verao…
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChampionshipView } from '@/components/championship/ChampionshipView';
import { isSupabaseConfigured } from '@/lib/config';
import { getChampionshipPage } from '@/lib/data/server';
import { assetUrl } from '@/lib/format';
import '../styles/campeonato.css';

export const revalidate = 60;

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const { championship: c } = await getChampionshipPage(slug);
  if (!c) return { title: 'Campeonato' };
  return {
    title: c.name,
    description: `${c.name}${c.date_label ? ` — ${c.date_label.toLowerCase()}` : ''}${c.location ? `, ${c.location}` : ''}. Times, inscrições e premiação.`,
    icons: c.logo_url ? { icon: assetUrl(c.logo_url) } : undefined,
    openGraph: c.logo_url ? { images: [assetUrl(c.logo_url)] } : undefined,
  };
}

export default async function ChampionshipPage(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params;
  const data = await getChampionshipPage(slug);

  // Com Supabase o servidor sabe todos os campeonatos: slug desconhecido é 404.
  // No modo local, o campeonato pode existir só no navegador; quem decide é a página.
  if (!data.championship && isSupabaseConfigured) notFound();

  return <ChampionshipView slug={slug} initial={data} />;
}
