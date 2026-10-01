// Landing: preenche jogos, parceiros, telefone e campeonato em destaque com os
// dados do painel. O HTML da página já traz o mesmo conteúdo como reserva, então
// se algo falhar aqui o site continua completo.
import {
  getDb, assetUrl, escapeHtml as e, formatMonthYear, formatPhone, initials, normalizePhone,
} from './data/store.js';

const PVPE_LOGO = assetUrl('assets/img/logo-pvpe.png');

run().catch((err) => console.warn('[PVPE] usando conteúdo estático:', err));

async function run() {
  const db = await getDb();
  const [games, partners, phones, championships] = await Promise.all([
    db.list('games', { orderBy: 'played_at', ascending: false }),
    db.list('partners', { orderBy: 'sort_order', ascending: true }),
    db.list('phones'),
    db.list('championships'),
  ]);

  renderGames(games.slice(0, 3));
  renderPartners(partners);
  applyPhone(phones.find((p) => p.is_primary) || phones[0]);
  renderChampionship(championships.find((c) => c.featured));
}

function team(name) {
  const isPvpe = String(name).trim().toUpperCase() === 'PVPE';
  const badge = isPvpe
    ? `<img src="${PVPE_LOGO}" alt="">`
    : `<span class="team-badge">${e(initials(name))}</span>`;
  return `<div class="team">${badge}<span>${e(name)}</span></div>`;
}

function renderGames(games) {
  const grid = document.querySelector('.games-grid');
  if (!grid) return;
  const section = grid.closest('.games');
  section.hidden = games.length === 0;
  grid.innerHTML = games.map((g) => `
    <article class="game-card">
      <div class="score">
        ${team(g.team_home)}
        <div class="score-num">${e(g.score_home)}<small>x</small>${e(g.score_away)}</div>
        ${team(g.team_away)}
      </div>
      <div class="game-info">
        ${g.event ? `<span class="game-event">${e(g.event)}</span>` : ''}
        ${g.result ? `<strong class="game-result">${e(g.result)}</strong>` : ''}
        <span class="game-date">${e(formatMonthYear(g.played_at))}</span>
      </div>
    </article>`).join('');
}

// A seção sempre mostra pelo menos 5 espaços; os que sobram ficam vazios.
const PARTNER_SLOTS = 5;

function renderPartners(partners) {
  const grid = document.querySelector('.partners-grid');
  if (!grid) return;
  const empty = Math.max(0, PARTNER_SLOTS - partners.length);
  grid.innerHTML = partners.map((p) => {
    const tag = p.link_url ? 'a' : 'div';
    const link = p.link_url ? ` href="${e(p.link_url)}" target="_blank" rel="noopener"` : '';
    const logo = p.logo_url
      ? `<img src="${e(assetUrl(p.logo_url))}" alt="${e(p.name)}" loading="lazy" onerror="this.remove()">`
      : '';
    return `<${tag} class="partner${p.logo_full ? ' partner--full' : ''}"${link}>
        ${logo}<span class="partner-name">${p.segment ? `<small>${e(p.segment)}</small>` : ''}${e(p.name)}</span>
      </${tag}>`;
  }).join('') + '<div class="partner partner--empty" aria-hidden="true"></div>'.repeat(empty);
}

// Troca o número em todos os links de WhatsApp, mantendo a mensagem de cada botão.
function applyPhone(phone) {
  if (!phone) return;
  const number = normalizePhone(phone.number);
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
    a.href = a.href.replace(/wa\.me\/\d*/, `wa.me/${number}`);
  });
  document.querySelectorAll('[data-whatsapp]').forEach((el) => { el.dataset.whatsapp = number; });
  document.querySelectorAll('[data-phone-display]').forEach((el) => { el.textContent = formatPhone(number); });
}

function renderChampionship(c) {
  const section = document.querySelector('.championship');
  if (!section) return;
  section.hidden = !c;
  if (!c) return;
  const logo = section.querySelector('.champ-logo');
  logo.hidden = !c.logo_url;
  if (c.logo_url) logo.src = assetUrl(c.logo_url);
  logo.alt = c.name;
  const banner = section.querySelector('.champ-banner');
  if (c.banner_url) banner.style.backgroundImage = `url("${assetUrl(c.banner_url)}")`;
  else banner.classList.add('champ-banner--plain');
  section.querySelector('.champ-btn').href = assetUrl(`campeonato/?c=${encodeURIComponent(c.slug)}`);
}
