'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { WhatsAppIcon } from '@/components/icons';
import { useLocalData } from '@/lib/data/use-local-data';
import { assetUrl, normalizePhone, primaryPhone, whatsappUrl } from '@/lib/format';
import { FALLBACK_PHONE, WA_MESSAGES } from '@/lib/messages';
import type { Championship, Phone } from '@/lib/types';
import { Countdown } from './Countdown';
import { GoldGradient, MedalIcon, RegistrationIcon, TrophyIcon } from './prize-icons';

type Props = { slug: string; initial: { championship: Championship | null; phones: Phone[] } };

export function ChampionshipView({ slug, initial }: Props) {
  const { data, ready } = useLocalData(initial, async (db) => ({
    championship: await db.findBy('championships', 'slug', slug),
    phones: await db.list('phones'),
  }));
  const c = data.championship;
  const phone = normalizePhone(primaryPhone(data.phones)?.number) || FALLBACK_PHONE;

  return (
    <div className="copa-page">
      <header className="copa-header">
        <div className="copa-wrap copa-topbar">
          <Link href="/" className="copa-back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            <span>VOLTAR</span>
          </Link>
          <Link href="/" className="brand">PVPE</Link>
          <a
            href={whatsappUrl(phone, c ? WA_MESSAGES.campeonato(c.name) : WA_MESSAGES.contato)}
            target="_blank"
            rel="noopener"
            className="btn btn-yellow copa-contact"
          >
            FALE CONOSCO
            <WhatsAppIcon />
          </a>
        </div>
      </header>

      {!c && !ready && (
        <div className="copa-wrap copa-state" id="state-loading">
          <img src="/assets/img/logo-pvpe.png" alt="" />
          <p>Carregando campeonato…</p>
        </div>
      )}

      {!c && ready && <ChampionshipMissing />}

      {c && <ChampionshipContent c={c} />}

      <Footer />
    </div>
  );
}

export function ChampionshipMissing() {
  return (
    <div className="copa-wrap copa-state">
      <img src="/assets/img/logo-pvpe.png" alt="" />
      <h1>Campeonato não encontrado</h1>
      <p>O link pode estar errado ou o campeonato foi removido.</p>
      <Link href="/" className="btn btn-yellow">VOLTAR PARA O INÍCIO</Link>
    </div>
  );
}

function ChampionshipContent({ c }: { c: Championship }) {
  const female = c.teams_female ?? [];
  const male = c.teams_male ?? [];
  const hasTeams = female.length > 0 || male.length > 0;
  const hasPrizes = Boolean(c.prize_first || c.prize_second);
  const bg = c.banner_url ? `url("${assetUrl(c.banner_url)}")` : undefined;

  const heroClass = [
    'copa-hero',
    !bg && 'copa-hero--plain',
    !c.starts_at && 'copa-hero--no-countdown',
  ].filter(Boolean).join(' ');

  return (
    <main className="copa-wrap copa-main">
      {/* BANNER + CONTADOR */}
      <section className={heroClass} style={bg ? { backgroundImage: bg } : undefined}>
        {c.logo_url
          ? <img src={assetUrl(c.logo_url)} alt={c.name} className="copa-hero-logo" />
          : <p className="copa-hero-name">{c.name}</p>}
        {c.starts_at && <Countdown startsAt={c.starts_at} endsAt={c.ends_at} />}
      </section>

      {/* INFORMAÇÕES + TIMES */}
      <div className="copa-grid">
        <div className="copa-info">
          <h1 className="copa-card copa-title">{c.name}</h1>

          {(c.date_label || c.location) && (
            <div className="copa-card copa-when">
              {c.date_label && (
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                  <span>
                    <strong>{c.date_label}</strong>
                    {c.time_label && <> · {c.time_label}</>}
                  </span>
                </p>
              )}
              {c.location && (
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                  <span>LOCAL: <strong>{c.location}</strong></span>
                </p>
              )}
            </div>
          )}

          {c.description && (
            <div className="copa-card copa-about">
              <h2>SOBRE O CAMPEONATO</h2>
              <p>{c.description}</p>
            </div>
          )}
        </div>

        {hasTeams && (
          <section className="copa-card copa-teams">
            <h2>TIMES</h2>
            <div className="teams-cols">
              <TeamList label="FEMININO" tagClass="tag-fem" teams={female} />
              <TeamList label="MASCULINO" tagClass="tag-masc" teams={male} />
            </div>
          </section>
        )}
      </div>

      {/* INSCRIÇÕES + PREMIAÇÃO */}
      {(c.registration_fee || hasPrizes) && (
        <section
          className="copa-prizes"
          id="premiacao"
          style={bg ? { backgroundImage: `linear-gradient(rgba(6, 26, 77, .55), rgba(6, 26, 77, .75)), ${bg}` } : undefined}
        >
          {c.registration_fee && (
            <div className="prize-block">
              <h2 className="brush">INSCRIÇÕES</h2>
              <div className={`prize-card prize-card--tall${c.registrations_open ? '' : ' is-closed'}`}>
                {!c.registrations_open && <span className="closed-stamp">INSCRIÇÕES<br />ENCERRADAS</span>}
                <RegistrationIcon />
                <div className="prize-text">
                  <strong className="prize-value">{c.registration_fee}</strong>
                  {c.registration_fee_note && <span className="prize-sub">{c.registration_fee_note}</span>}
                </div>
              </div>
            </div>
          )}

          {hasPrizes && (
            <div className="prize-block">
              <h2 className="brush">PREMIAÇÃO</h2>
              {c.prize_first && (
                <div className="prize-card">
                  <TrophyIcon />
                  <div className="prize-text">
                    <span className="prize-label">1º LUGAR</span>
                    <strong className="prize-value">{c.prize_first}</strong>
                    {c.prize_first_extra && <span className="prize-sub">{c.prize_first_extra}</span>}
                  </div>
                </div>
              )}
              {c.prize_second && (
                <div className="prize-card">
                  <MedalIcon />
                  <div className="prize-text">
                    <span className="prize-label">2º LUGAR</span>
                    <strong className="prize-value">{c.prize_second}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <GoldGradient />
        </section>
      )}
    </main>
  );
}

function TeamList({ label, tagClass, teams }: { label: string; tagClass: string; teams: string[] }) {
  if (!teams.length) return null;
  return (
    <div className="teams-col">
      <h3>
        <span className={tagClass}>{label}</span>{' '}
        <small>{teams.length} {teams.length === 1 ? 'time' : 'times'}</small>
      </h3>
      <ol>
        {teams.map((t, i) => <li key={`${t}-${i}`}>{t}</li>)}
      </ol>
    </div>
  );
}
