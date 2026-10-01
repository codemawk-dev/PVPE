// Definição de cada seção do painel: tabela, ordenação, campos do formulário e
// como cada registro aparece na lista. Para um campo novo, adicione-o aqui,
// em lib/types.ts e a coluna em supabase/schema.sql.
import type { ReactNode } from 'react';
import { assetUrl, formatMonthYear, formatPhone, initials, normalizePhone } from '@/lib/format';
import type { Row, TableName } from '@/lib/types';

export type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'tel' | 'url' | 'textarea' | 'lines' | 'checkbox' | 'image';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  half?: boolean;
  placeholder?: string;
  help?: string;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  pattern?: string;
  prefix?: string;
  rows?: number;
  folder?: string; // pasta no Storage (imagens)
  wide?: boolean; // miniatura larga (imagens de banner)
  format?: (v: unknown) => string;
};

export type FieldOrGroup = Field | { group: string };

export type Resource<T extends TableName = TableName> = {
  table: T;
  title: string;
  singular: string;
  icon: string;
  desc: string;
  orderBy: string;
  ascending: boolean;
  /** campo booleano que só pode estar marcado em um registro (destaque / principal) */
  exclusiveFlag?: string;
  /** campo que não pode se repetir entre registros */
  unique?: { field: string; message: string };
  fields: FieldOrGroup[];
  beforeSave?: (data: Record<string, unknown>) => Record<string, unknown>;
  label: (row: Row<T>) => string;
  render: (row: Row<T>) => ReactNode;
};

function Thumb({ url, name, full }: { url: string | null; name: string; full?: boolean }) {
  return url
    ? <img className={`row-thumb${full ? ' row-thumb--full' : ''}`} src={assetUrl(url)} alt="" />
    : <div className="row-thumb row-thumb--empty">{initials(name)}</div>;
}

// endereços que já são rotas do site
const RESERVED_SLUGS = ['p-admin', 'campeonato', 'assets', 'api', '_next'];

const meta = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

const games: Resource<'games'> = {
  table: 'games',
  title: 'Últimos jogos',
  singular: 'jogo',
  icon: '🏐',
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
  label: (g) => `${g.team_home} x ${g.team_away}`,
  render: (g) => (
    <div className="row-main">
      <div className="row-score">
        <span>{g.team_home}</span>
        <strong>{g.score_home} <small>x</small> {g.score_away}</strong>
        <span>{g.team_away}</span>
      </div>
      <p className="row-meta">{meta(g.event, g.result, formatMonthYear(g.played_at))}</p>
    </div>
  ),
};

const championships: Resource<'championships'> = {
  table: 'championships',
  title: 'Campeonatos',
  singular: 'campeonato',
  icon: '🏆',
  desc: 'Cada campeonato ganha a página /endereço. O que está em destaque aparece no banner da página inicial.',
  orderBy: 'starts_at',
  ascending: false,
  exclusiveFlag: 'featured',
  unique: { field: 'slug', message: 'Já existe um campeonato com esse endereço.' },
  beforeSave(data) {
    if (RESERVED_SLUGS.includes(String(data.slug))) {
      throw new Error(`O endereço "${data.slug}" é reservado pelo site. Escolha outro.`);
    }
    return data;
  },
  fields: [
    { group: 'Informações' },
    { name: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: 1º Copa do Mel de Vôlei' },
    {
      name: 'slug', label: 'Endereço da página', type: 'text', required: true, prefix: '/',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', placeholder: 'copa-do-mel',
      help: 'Só letras minúsculas, números e hífen. Ex.: copa-do-mel → site.com/copa-do-mel',
    },
    { name: 'logo_url', label: 'Logo do campeonato', type: 'image', folder: 'campeonatos' },
    { name: 'banner_url', label: 'Imagem de fundo do banner', type: 'image', folder: 'campeonatos', wide: true, help: 'Formato largo (ex.: 2400 × 730). Sem imagem, o banner usa um degradê azul.' },
    { name: 'featured', label: 'Destaque na página inicial', type: 'checkbox', help: 'Só um campeonato fica em destaque; marcar este desmarca o anterior.' },
    { name: 'description', label: 'Sobre o campeonato', type: 'textarea', rows: 5 },

    { group: 'Data e local' },
    { name: 'starts_at', label: 'Início (contador)', type: 'datetime', half: true, help: 'Horário da Bahia. Vazio: sem contador.' },
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
  label: (c) => c.name,
  render: (c) => (
    <>
      <Thumb url={c.logo_url} name={c.name} />
      <div className="row-main">
        <h3>{c.name}</h3>
        <p className="row-meta">{meta(c.date_label, c.location)}</p>
        <div className="tags">
          {c.featured && <span className="tag tag--yellow">Destaque</span>}
          {c.registrations_open
            ? <span className="tag tag--green">Inscrições abertas</span>
            : <span className="tag tag--red">Inscrições encerradas</span>}
          <span className="tag">{(c.teams_female ?? []).length} fem · {(c.teams_male ?? []).length} masc</span>
        </div>
      </div>
      <a className="row-link" href={`/${c.slug}`} target="_blank" rel="noopener">/{c.slug} ↗</a>
    </>
  ),
};

const phones: Resource<'phones'> = {
  table: 'phones',
  title: 'Telefones',
  singular: 'telefone',
  icon: '☎',
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
    const number = normalizePhone(data.number);
    if (!/^\d{12,13}$/.test(number)) throw new Error('Número inválido: use DDD + número, ex.: (73) 99133-5759.');
    return { ...data, number };
  },
  label: (p) => p.label,
  render: (p) => (
    <>
      <div className="row-icon">☎</div>
      <div className="row-main">
        <h3>{p.label}</h3>
        <p className="row-meta">{formatPhone(p.number)}</p>
        {p.is_primary && <div className="tags"><span className="tag tag--yellow">Principal</span></div>}
      </div>
      <a className="row-link" href={`https://wa.me/${p.number}`} target="_blank" rel="noopener">Testar ↗</a>
    </>
  ),
};

const partners: Resource<'partners'> = {
  table: 'partners',
  title: 'Parceiros',
  singular: 'parceiro',
  icon: '🤝',
  desc: 'Aparecem em "Nossos parceiros", na ordem definida aqui. A seção sempre mostra pelo menos 5 espaços; os que sobram ficam vazios.',
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
  label: (p) => p.name,
  render: (p) => (
    <>
      <Thumb url={p.logo_url} name={p.name} full={p.logo_full} />
      <div className="row-main">
        <h3>{p.name}</h3>
        <p className="row-meta">{meta(p.segment, p.link_url) || 'Sem link'}</p>
        <div className="tags">
          <span className="tag">Ordem {p.sort_order ?? 0}</span>
          {!p.logo_url && <span className="tag">Só texto</span>}
        </div>
      </div>
    </>
  ),
};

export const resources = { games, championships, phones, partners } as unknown as Record<TableName, Resource>;
export const resourceKeys = Object.keys(resources) as TableName[];
