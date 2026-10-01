// Página-modelo de campeonato (/campeonato/?c=slug).
// Qual campeonato mostrar:
//   1. ?c=slug na URL
//   2. senão, o campeonato marcado como destaque no painel
import { getDb, assetUrl, escapeHtml as e, normalizePhone } from './data/store.js';

const $ = (sel) => document.querySelector(sel);
const box = $('#countdown');

load().catch((err) => {
  console.error('[PVPE] erro ao carregar campeonato:', err);
  showState('missing');
});

async function load() {
  const db = await getDb();
  const slug = new URLSearchParams(location.search).get('c');

  const [c, phones] = await Promise.all([
    slug
      ? db.findBy('championships', 'slug', slug)
      : db.list('championships').then((all) => all.find((x) => x.featured) || null),
    db.list('phones'),
  ]);

  if (!c) return showState('missing');

  render(c, phones.find((p) => p.is_primary) || phones[0]);
  showState('ready');
  startCountdown(c);
}

function showState(state) {
  document.body.classList.remove('is-loading');
  $('#state-loading').hidden = true;
  $('#state-missing').hidden = state !== 'missing';
  $('#champ').hidden = state !== 'ready';
  if (state === 'missing') document.title = 'Campeonato não encontrado — PVPE';
}

function render(c, phone) {
  document.title = `${c.name} — PVPE`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.content = `${c.name}${c.date_label ? ` — ${c.date_label.toLowerCase()}` : ''}${c.location ? `, ${c.location}` : ''}. Times, inscrições e premiação.`;

  // banner: fundo e logo próprios de cada campeonato
  const hero = $('.copa-hero');
  if (c.banner_url) {
    const bg = `url("${assetUrl(c.banner_url)}")`;
    hero.style.backgroundImage = bg;
    $('.copa-prizes').style.backgroundImage =
      `linear-gradient(rgba(6, 26, 77, .55), rgba(6, 26, 77, .75)), ${bg}`;
  } else {
    hero.classList.add('copa-hero--plain');
  }
  const logo = $('.copa-hero-logo');
  if (c.logo_url) {
    logo.src = assetUrl(c.logo_url);
    logo.alt = c.name;
    logo.hidden = false;
  } else {
    hero.classList.add('copa-hero--no-logo');
  }

  // WhatsApp com o número principal e o nome do campeonato na mensagem
  const wa = $('[data-wa-context]');
  if (wa) {
    const number = phone ? normalizePhone(phone.number) : wa.href.match(/wa\.me\/(\d+)/)[1];
    wa.href = `https://wa.me/${number}?text=${encodeURIComponent(`Olá! Vim pela página do campeonato ${c.name} e gostaria de mais informações.`)}`;
  }

  // textos simples
  document.querySelectorAll('[data-field]').forEach((el) => {
    el.textContent = c[el.dataset.field] || '';
  });

  // listas de times
  ['teams_female', 'teams_male'].forEach((key) => {
    const teams = c[key] || [];
    const list = $(`[data-list="${key}"]`);
    list.innerHTML = teams.map((t) => `<li>${e(t)}</li>`).join('');
    $(`[data-count="${key}"]`).textContent = `${teams.length} ${teams.length === 1 ? 'time' : 'times'}`;
    list.closest('.teams-col').hidden = teams.length === 0;
  });

  // blocos que só aparecem se o(s) campo(s) tiver(em) conteúdo
  const has = (key) => (Array.isArray(c[key]) ? c[key].length > 0 : !!c[key]);
  document.querySelectorAll('[data-show]').forEach((el) => { el.hidden = !has(el.dataset.show); });
  document.querySelectorAll('[data-show-any]').forEach((el) => {
    el.hidden = !el.dataset.showAny.split(' ').some(has);
  });

  // inscrições encerradas
  const reg = $('[data-registration]');
  reg.classList.toggle('is-closed', !c.registrations_open);
  reg.querySelector('.closed-stamp').hidden = !!c.registrations_open;
}

function startCountdown(c) {
  if (!c.starts_at) {
    box.hidden = true;
    $('.copa-hero').classList.add('copa-hero--no-countdown');
    return;
  }
  const start = new Date(c.starts_at).getTime();
  const end = new Date(c.ends_at || c.starts_at).getTime();
  const els = {};
  box.querySelectorAll('[data-unit]').forEach((el) => { els[el.dataset.unit] = el; });
  const pad = (n) => String(n).padStart(2, '0');
  let timer;

  function tick() {
    const now = Date.now();
    if (now >= end && now >= start) {
      box.classList.remove('is-live');
      box.classList.add('is-over');
      box.querySelector('.countdown-live').textContent = 'CAMPEONATO ENCERRADO — OBRIGADO, TORCIDA!';
      clearInterval(timer);
      return;
    }
    if (now >= start) {
      box.classList.add('is-live');
      return;
    }
    const s = Math.floor((start - now) / 1000);
    els.d.textContent = pad(Math.floor(s / 86400));
    els.h.textContent = pad(Math.floor((s % 86400) / 3600));
    els.m.textContent = pad(Math.floor((s % 3600) / 60));
    els.s.textContent = pad(s % 60);
  }

  tick();
  timer = setInterval(tick, 1000);
}
