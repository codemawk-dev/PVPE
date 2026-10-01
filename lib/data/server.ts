// Leitura no SERVIDOR para as páginas públicas.
// Com Supabase configurado, busca do banco (as páginas revalidam a cada 60 s);
// sem ele, usa os dados iniciais de lib/seed.ts.
import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseConfig } from '../config';
import { seed } from '../seed';
import type { Championship, SiteData } from '../types';

function client() {
  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getSiteData(): Promise<SiteData> {
  if (!isSupabaseConfigured) return seed;
  const sb = client();
  const [games, partners, phones, championships] = await Promise.all([
    sb.from('games').select('*').order('played_at', { ascending: false }),
    sb.from('partners').select('*').order('sort_order', { ascending: true }),
    sb.from('phones').select('*'),
    sb.from('championships').select('*'),
  ]);
  return {
    games: check(games),
    partners: check(partners),
    phones: check(phones),
    championships: check(championships),
  };
}

// cache(): metadados e página pedem o mesmo campeonato; busca uma vez por requisição.
export const getChampionshipPage = cache(async (slug: string): Promise<{
  championship: Championship | null;
  phones: SiteData['phones'];
}> => {
  if (!isSupabaseConfigured) {
    return {
      championship: seed.championships.find((c) => c.slug === slug) ?? null,
      phones: seed.phones,
    };
  }
  const sb = client();
  const [champ, phones] = await Promise.all([
    sb.from('championships').select('*').eq('slug', slug).maybeSingle(),
    sb.from('phones').select('*'),
  ]);
  return { championship: check(champ), phones: check(phones) };
});

export async function getFeaturedSlug(): Promise<string | null> {
  if (!isSupabaseConfigured) return seed.championships.find((c) => c.featured)?.slug ?? null;
  const row = check(
    await client().from('championships').select('slug').eq('featured', true).maybeSingle(),
  ) as Pick<Championship, 'slug'> | null;
  return row?.slug ?? null;
}
