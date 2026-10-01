// Definição de cada seção do painel: tabela, ordenação, campos do formulário
// e como cada registro aparece na lista. Para um campo novo, adicione aqui
// (e a coluna correspondente em supabase/schema.sql).
import {
  assetUrl, escapeHtml as e, formatMonthYear, formatPhone, normalizePhone, initials,
} from '../data/store.js';

export const resources = {
  games: {
    table: 'games',
    title: 'Últimos jogos',
    singular: 'jogo',
    desc: 'Os 3 jogos mais recentes aparecem na seção "Últimos jogos" da página inicial.',
    orderBy: 'played_at',
    ascending: false,
    fields: [
      { name: 'team_home', label: 'Time da casa', type: 'text', default: 'PVPE', required: true, half: true },
      { name: 'team_away', label: 'Adversário', type: 'text', required: true, half: true, placeholder: 'Ex.: ITABUNA VC' },
      { name: 'score_home', label: 'Sets da casa', type: 'number', default: 0, min: 0, max: 5, half: true },
      { name: 'score_away', label: 'Sets do adversário', type: 'number', default: 0, min: 0, max: 5, half: true },
      { name: 'event', label: 'Campeonato / evento', type: 'text', placeholder: 'Ex.: COPA SUL DA BAHIA' },
      { name: 'result', label: 'Resultado / categoria', type: 'text', placeholder: 'Ex.: CAMPEÃO FEMININO' },
      { name: 'played_at', label: 'Data do jogo', type: 'date', required: true, help: 'Na página aparece como mês/ano.' },
    ],
    row: (g) => `
      <div class="row-main">
        <div class="row-score">
          <span>${e(g.team_home)}</span>
          <strong>${e(g.score_home)} <small>x</small> ${e(g.score_away)}</strong>
          <span>${e(g.team_away)}</span>
        </div>
        <p class="row-meta">${[g.event, g.result, formatMonthYear(g.played_at)].filter(Boolean).map(e).join(' · ')}</p>
      </div>`,
  },

  championships: {
    table: 'championships',
    title: 'Campeonatos',
    singular: 'campeonato',
    desc: 'O campeonato em destaque aparece no banner da página inicial e na página do campeonato.',
    orderBy: 'starts_at',
    ascending: false,
    exclusiveFlag: 'featured',
    fields: [
      { group: 'Informações' },
      { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: 1º Copa do Mel de Vôlei' },
      {
        name: 'slug', label: 'Endereço da página', type: 'text', required: true, prefix: '/',
        pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', placeholder: 'copa-do-mel',
        help: 'Só letras minúsculas, números e hífen. A página fica em /campeonato/?c=endereço (e em /endereço/ nas hospedagens que usam o 404.html).',
      },
      { name: 'logo_url', label: 'Logo do campeonato', type: 'image', folder: 'campeonatos' },
      { name: 'banner_url', label: 'Imagem de fundo do banner', type: 'image', folder: 'campeonatos', wide: true, help: 'Formato largo (ex.: 2400 × 730). Sem imagem, o banner usa um degradê azul.' },
      { name: 'featured', label: 'Destaque na página inicial', type: 'checkbox', help: 'Só um campeonato fica em destaque; marcar este desmarca o anterior.' },
      { name: 'description', label: 'Sobre o campeonato', type: 'textarea', rows: 5 },

      { group: 'Data e local' },
      { name: 'starts_at', label: 'Início (contador)', type: 'datetime', required: true, half: true, help: 'Horário da Bahia.' },
      { name: 'ends_at', label: 'Término', type: 'datetime', half: true, help: 'Depois disso o contador mostra "encerrado".' },
      { name: 'date_label', label: 'Texto da data', type: 'text', half: true, placeholder: '28 E 29 DE NOVEMBRO' },
      { name: 'time_label', label: 'Texto do horário', type: 'text', half: true, placeholder: 'A PARTIR DAS 8H' },
      { name: 'location', label: 'Local', type: 'text', placeholder: 'FERREIRÃO' },

      { group: 'Times' },
      { name: 'teams_female', label: 'Times femininos', type: 'lines', half: true, help: 'Um time por linha.' },
      { name: 'teams_male', label: 'Times masculinos', type: 'lines', half: true, help: 'Um time por linha.' },

      { group: 'Inscrições e premiação' },
      { name: 'registrations_open', label: 'Inscrições abertas', type: 'checkbox', default: true, help: 'Desmarcado: o card mostra o selo "Inscrições encerradas".' },
      { name: 'registration_fee', label: 'Valor da inscrição', type: 'text', half: true, placeholder: 'R$ 350' },
      { name: 'registration_fee_note', label: 'Complemento', type: 'text', half: true, placeholder: 'POR EQUIPE' },
      { name: 'prize_first', label: '1º lugar', type: 'text', half: true, placeholder: 'R$ 1.000' },
      { name: 'prize_first_extra', label: '1º lugar — extra', type: 'text', half: true, placeholder: '+ TROFÉU' },
      { name: 'prize_second', label: '2º lugar', type: 'text', placeholder: 'MEDALHAS' },
    ],
    row: (c) => `
      ${thumb(c.logo_url, c.name)}
      <div class="row-main">
        <h3>${e(c.name)}</h3>
        <p class="row-meta">${[c.date_label, c.location].filter(Boolean).map(e).join(' · ')}</p>
        <div class="tags">
          ${c.featured ? '<span class="tag tag--yellow">Destaque</span>' : ''}
          ${c.registrations_open ? '<span class="tag tag--green">Inscrições abertas</span>' : '<span class="tag tag--red">Inscrições encerradas</span>'}
          <span class="tag">${(c.teams_female || []).length} fem · ${(c.teams_male || []).length} masc</span>
        </div>
      </div>
      <a class="row-link" href="../campeonato/?c=${encodeURIComponent(c.slug)}" target="_blank" rel="noopener">Ver página ↗</a>`,
  },

  phones: {
    table: 'phones',
    title: 'Telefones',
    singular: 'telefone',
    desc: 'O telefone principal é usado em todos os botões de WhatsApp do site.',
    orderBy: 'label',
    ascending: true,
    exclusiveFlag: 'is_primary',
    fields: [
      { name: 'label', label: 'Identificação', type: 'text', required: true, placeholder: 'Ex.: WhatsApp principal' },
      {
        name: 'number', label: 'Número (com DDD)', type: 'tel', required: true, placeholder: '(73) 99133-5759',
        format: formatPhone, help: 'O código do Brasil (55) é adicionado automaticamente.',
      },
      { name: 'is_primary', label: 'Telefone principal do site', type: 'checkbox' },
    ],
    beforeSave(data) {
      data.number = normalizePhone(data.number);
      if (!/^\d{12,13}$/.test(data.number)) throw new Error('Número inválido: use DDD + número, ex.: (73) 99133-5759.');
      return data;
    },
    row: (p) => `
      <div class="row-icon">☎</div>
      <div class="row-main">
        <h3>${e(p.label)}</h3>
        <p class="row-meta">${e(formatPhone(p.number))}</p>
        ${p.is_primary ? '<div class="tags"><span class="tag tag--yellow">Principal</span></div>' : ''}
      </div>
      <a class="row-link" href="https://wa.me/${e(p.number)}" target="_blank" rel="noopener">Testar ↗</a>`,
  },

  partners: {
    table: 'partners',
    title: 'Parceiros',
    singular: 'parceiro',
    desc: 'Aparecem na seção "Nossos parceiros", na ordem definida aqui. Sem logo, o card mostra o nome.',
    orderBy: 'sort_order',
    ascending: true,
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true, half: true },
      { name: 'segment', label: 'Ramo', type: 'text', half: true, placeholder: 'Ex.: Mercado' },
      { name: 'logo_url', label: 'Logo', type: 'image', folder: 'parceiros' },
      { name: 'logo_full', label: 'Logo com fundo próprio', type: 'checkbox', help: 'Marque se a logo é quadrada e colorida: ela passa a preencher o card inteiro.' },
      { name: 'link_url', label: 'Link (site ou Instagram)', type: 'url', placeholder: 'https://' },
      { name: 'sort_order', label: 'Ordem', type: 'number', default: 0, min: 0, help: 'Menor número aparece primeiro.' },
    ],
    row: (p) => `
      ${thumb(p.logo_url, p.name, p.logo_full)}
      <div class="row-main">
        <h3>${e(p.name)}</h3>
        <p class="row-meta">${[p.segment, p.link_url].filter(Boolean).map(e).join(' · ') || 'Sem link'}</p>
        <div class="tags"><span class="tag">Ordem ${e(p.sort_order ?? 0)}</span>${p.logo_url ? '' : '<span class="tag">Só texto</span>'}</div>
      </div>`,
  },
};

function thumb(url, name, full) {
  return url
    ? `<img class="row-thumb${full ? ' row-thumb--full' : ''}" src="${e(assetUrl(url))}" alt="">`
    : `<div class="row-thumb row-thumb--empty">${e(initials(name))}</div>`;
}
