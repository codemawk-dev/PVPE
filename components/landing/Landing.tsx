'use client';

import { useState } from 'react';
import { Footer } from '@/components/Footer';
import { useLocalData } from '@/lib/data/use-local-data';
import { normalizePhone, primaryPhone } from '@/lib/format';
import { FALLBACK_PHONE } from '@/lib/messages';
import type { SiteData } from '@/lib/types';
import { About, Actions, ChampionshipBanner, Court, Games, Hero, Marquee, Partners } from './sections';
import { ShirtModal } from './ShirtModal';

export function Landing({ initial }: { initial: SiteData }) {
  const { data } = useLocalData(initial, async (db) => {
    const [games, partners, phones, championships] = await Promise.all([
      db.list('games', { orderBy: 'played_at', ascending: false }),
      db.list('partners', { orderBy: 'sort_order', ascending: true }),
      db.list('phones'),
      db.list('championships'),
    ]);
    return { games, partners, phones, championships };
  });
  const [shirtOpen, setShirtOpen] = useState(false);

  const phone = normalizePhone(primaryPhone(data.phones)?.number) || FALLBACK_PHONE;

  return (
    <>
      <Hero phone={phone} />
      <Marquee />
      <main>
        <Partners partners={data.partners} />
        <About />
        <Games games={data.games} />
        <ChampionshipBanner championship={data.championships.find((c) => c.featured)} />
        <Actions phone={phone} onShirtClick={() => setShirtOpen(true)} />
        <Court phone={phone} />
      </main>
      <Footer />
      <ShirtModal open={shirtOpen} onClose={() => setShirtOpen(false)} phone={phone} />
    </>
  );
}
