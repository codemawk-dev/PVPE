import Link from 'next/link';
import { useState } from 'react';
import { InstagramIcon, WhatsAppIcon } from '@/components/icons';
import { assetUrl, formatMonthYear, formatPhone, initials, whatsappUrl } from '@/lib/format';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WA_MESSAGES } from '@/lib/messages';
import type { Championship, Game, Partner } from '@/lib/types';

export function Hero({ phone }: { phone: string }) {
  return (
    <header className="hero">
      <div className="container topbar">
        <Link href="/" className="brand">PVPE</Link>
        <a href={whatsappUrl(phone, WA_MESSAGES.contato)} target="_blank" rel="noopener" className="btn btn-yellow btn-contact">
          FALE CONOSCO
          <WhatsAppIcon />
        </a>
      </div>

      <div className="hero-content">
        <img src="/assets/img/logo-pvpe.png" alt="Escudo PVPE" className="hero-logo" />
        <p className="hero-pre">PROJETO DE VÔLEI</p>
        <h1 className="hero-title">PEDRO EDUARDO</h1>
        <ul className="hero-info">
          <li>URUÇUCA - BA</li>
          <li>FEMININO E MASCULINO</li>
          <li>TREINADOR: DANIEL CHAVES</li>
        </ul>
        <a href="#sobre" className="btn btn-yellow btn-cta">CONHEÇA O PROJETO</a>
      </div>
    </header>
  );
}

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {Array.from({ length: 20 }, (_, i) => <span key={i}>PVPE</span>)}
      </div>
    </div>
  );
}

// A seção sempre mostra pelo menos 5 espaços; os que sobram ficam vazios.
const PARTNER_SLOTS = 5;

export function Partners({ partners }: { partners: Partner[] }) {
  const empty = Math.max(0, PARTNER_SLOTS - partners.length);
  return (
    <section className="partners">
      <h2 className="section-title">NOSSOS PARCEIROS</h2>
      <div className="partners-grid">
        {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
        {Array.from({ length: empty }, (_, i) => (
          <div key={`empty-${i}`} className="partner partner--empty" aria-hidden="true" />
        ))}
      </div>
    </section>
  );
}

// Se a logo não carregar, o card mostra o nome no lugar.
function PartnerCard({ partner: p }: { partner: Partner }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(p.logo_url) && !logoFailed;
  const content = (
    <>
      {showLogo && <img src={assetUrl(p.logo_url)} alt={p.name} loading="lazy" onError={() => setLogoFailed(true)} />}
      <span className="partner-name">
        {p.segment && <small>{p.segment}</small>}
        {p.name}
      </span>
    </>
  );
  const className = `partner${p.logo_full && showLogo ? ' partner--full' : ''}`;
  return p.link_url
    ? <a href={p.link_url} target="_blank" rel="noopener" className={className}>{content}</a>
    : <div className={className}>{content}</div>;
}

export function About() {
  return (
    <section className="about" id="sobre">
      <div className="container about-content">
        <h2>SOBRE O PROJETO PVPE</h2>
        <p>
          o pvpe (projeto de volei pedro eduardo) nasceu com o objetivo de transformar vidas através do esporte.<br />
          acreditamos que o vôlei vai além das quadras: ele educa, disciplina, una e abre caminhos para futuro melhor para crianças e adolescentes de uruçuca - ba.
        </p>
      </div>
    </section>
  );
}

function Team({ name }: { name: string }) {
  const isPvpe = name.trim().toUpperCase() === 'PVPE';
  return (
    <div className="team">
      {isPvpe ? <img src="/assets/img/logo-pvpe.png" alt="" /> : <span className="team-badge">{initials(name)}</span>}
      <span>{name}</span>
    </div>
  );
}

export function Games({ games }: { games: Game[] }) {
  if (!games.length) return null;
  return (
    <section className="games">
      <h2>ÚLTIMOS JOGOS</h2>
      <div className="games-grid">
        {games.slice(0, 3).map((g) => (
          <article key={g.id} className="game-card">
            <div className="score">
              <Team name={g.team_home} />
              <div className="score-num">{g.score_home}<small>x</small>{g.score_away}</div>
              <Team name={g.team_away} />
            </div>
            <div className="game-info">
              {g.event && <span className="game-event">{g.event}</span>}
              {g.result && <strong className="game-result">{g.result}</strong>}
              <span className="game-date">{formatMonthYear(g.played_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ChampionshipBanner({ championship: c }: { championship?: Championship }) {
  if (!c) return null;
  return (
    <section className="championship" id="campeonato">
      <div
        className={`champ-banner${c.banner_url ? '' : ' champ-banner--plain'}`}
        style={c.banner_url ? { backgroundImage: `url("${assetUrl(c.banner_url)}")` } : undefined}
      >
        {c.logo_url && <img src={assetUrl(c.logo_url)} alt={c.name} className="champ-logo" />}
        <Link href={`/${c.slug}`} className="btn btn-yellow champ-btn">VER CAMPEONATO</Link>
      </div>
    </section>
  );
}

export function Actions({ phone, onShirtClick }: { phone: string; onShirtClick: () => void }) {
  return (
    <section className="actions">
      <div className="actions-grid">
        <div className="action-card">
          <h3>SOLICITAR CAMISA</h3>
          <p>Garanta a sua camisa do pvpe<br />e vista essa história!</p>
          <button type="button" className="btn btn-outline" onClick={onShirtClick}>SOLICITAR CAMISA</button>
        </div>
        <div className="action-card">
          <h3>APOIE O PVPE</h3>
          <p>Sua ajuda faz toda a diferença para continuarmos formando campeões dentro o fora das quadras.</p>
          <a href={whatsappUrl(phone, WA_MESSAGES.apoiar)} target="_blank" rel="noopener" className="btn btn-outline">QUERO APOIAR</a>
        </div>
      </div>

      <div className="join">
        <h3>FAÇA PARTE DO PVPE</h3>
        <p>venha treinar, crescer e conquistar com a gente!</p>
        <a href={whatsappUrl(phone, WA_MESSAGES.fazerParte)} target="_blank" rel="noopener" className="btn btn-dark">FAÇA PARTE DO PVPE</a>
      </div>

      <div className="ball-area">
        <img src="/assets/img/bola_volei.png" alt="" className="ball" />
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: 'Ana Clara', meta: '14 anos · Sub-15', quote: 'Entrei no PVPE sem saber nem sacar. Hoje sou titular e aprendi que disciplina vale tanto dentro quanto fora da quadra.' },
  { name: 'Júlia Santos', meta: '16 anos · Sub-17', quote: 'O projeto virou minha segunda família. O professor Daniel acredita na gente até quando a gente mesma duvida.' },
  { name: 'Maria Eduarda', meta: '12 anos · Sub-13', quote: 'Minhas notas na escola melhoraram depois que comecei a treinar. Aqui eu fiz amigas e ganhei confiança!' },
];

export function Court({ phone }: { phone: string }) {
  return (
    <section className="court">
      <div className="court-bg" aria-hidden="true">
        <img src="/assets/img/quadra.png" alt="" />
        <div className="court-shade" />
      </div>

      <div className="court-inner">
        <h2>O QUE NOSSAS ALUNAS DISSERAM</h2>
        <div className="testimonials">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="testimonial">
              <div className="stars" aria-label="5 estrelas">★★★★★</div>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <span className="avatar">{initials(t.name)}</span>
                <span><strong>{t.name}</strong>{t.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="container socials">
          <div className="socials-text">
            <h2>ACOMPANHE NOSSAS REDES</h2>
            <p>Bastidores dos treinos, resultados dos jogos e as conquistas das nossas atletas. Siga e faça parte dessa torcida!</p>
          </div>
          <div className="social-links">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="social">
              <InstagramIcon />
              <strong>Instagram</strong>
              <span>{INSTAGRAM_HANDLE}</span>
            </a>
            <a href={whatsappUrl(phone, WA_MESSAGES.redes)} target="_blank" rel="noopener" className="social">
              <WhatsAppIcon className="filled" />
              <strong>WhatsApp</strong>
              <span>{formatPhone(phone)}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
