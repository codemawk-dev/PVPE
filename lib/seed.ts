// Dados iniciais (conteúdo atual do site). Usados quando o Supabase não está
// configurado e espelhados nos INSERTs de supabase/schema.sql.
// Caminhos de imagem são relativos à pasta public/.
import type { SiteData } from './types';

export const seed: SiteData = {
  games: [
    {
      id: 'b3b0c1a2-0001-4c1a-9a00-000000000001',
      team_home: 'PVPE', team_away: 'ITABUNA VC', score_home: 3, score_away: 1,
      event: 'COPA SUL DA BAHIA', result: 'CAMPEÃO FEMININO', played_at: '2027-03-01',
    },
    {
      id: 'b3b0c1a2-0001-4c1a-9a00-000000000002',
      team_home: 'PVPE', team_away: 'ILHÉUS VÔLEI', score_home: 3, score_away: 2,
      event: 'JOGOS ESCOLARES DA BAHIA', result: 'CAMPEÃO MASCULINO', played_at: '2027-02-01',
    },
    {
      id: 'b3b0c1a2-0001-4c1a-9a00-000000000003',
      team_home: 'PVPE', team_away: 'JEQUIÉ SPORT', score_home: 2, score_away: 3,
      event: 'TORNEIO REGIONAL SUB-17', result: 'VICE-CAMPEÃO FEMININO', played_at: '2027-01-01',
    },
  ],

  championships: [
    {
      id: 'b3b0c1a2-0002-4c1a-9a00-000000000001',
      slug: 'copa-do-mel',
      name: '1º Copa do Mel de Vôlei',
      starts_at: '2026-11-28T08:00:00-03:00',
      ends_at: '2026-11-29T20:00:00-03:00',
      date_label: '28 E 29 DE NOVEMBRO',
      time_label: 'A PARTIR DAS 8H',
      location: 'FERREIRÃO',
      description: 'A 1º Copa do Mel de Vôlei reúne equipes da região em dois dias de jogos, com disputas no feminino e no masculino. Organizada pelo PVPE, a copa celebra o esporte, a disciplina e a união das nossas comunidades — com torcida animada, muita garra e um campeonato doce como mel. Traga sua família e venha torcer!',
      teams_female: ['URUÇUCA', 'GUAXINIM', 'GUAXINIM SUB', 'AABB ILHÉUS', 'ITAPITANGA', 'ELITE VÔLEI CLUBE (UNA)'],
      teams_male: ['URUÇUCA', 'ITAPITANGA', 'A.D. GARRA (IPIAÚ)', 'ELITE VÔLEI CLUBE (UNA)', 'VNV - MODELO (ITABUNA)', 'ALPHA (UBAITABA)'],
      registration_fee: 'R$ 350',
      registration_fee_note: 'POR EQUIPE',
      registrations_open: false,
      prize_first: 'R$ 1.000',
      prize_first_extra: '+ TROFÉU',
      prize_second: 'MEDALHAS',
      logo_url: 'assets/img/logo-camp-mel.webp',
      banner_url: 'assets/img/camp-bg.webp',
      featured: true,
    },
  ],

  phones: [
    {
      id: 'b3b0c1a2-0003-4c1a-9a00-000000000001',
      label: 'WhatsApp principal', number: '5573991335759', is_primary: true,
    },
  ],

  partners: [
    {
      id: 'b3b0c1a2-0004-4c1a-9a00-000000000001',
      name: 'codeMAWK', segment: 'Tecnologia', logo_url: 'assets/img/parceiros/codemawk.webp',
      logo_full: true, link_url: 'https://instagram.com/codemawk', sort_order: 1,
    },
    {
      id: 'b3b0c1a2-0004-4c1a-9a00-000000000002',
      name: 'devART', segment: 'Design & Dev', logo_url: 'assets/img/parceiros/devart.webp',
      logo_full: true, link_url: 'https://www.devartx.com', sort_order: 2,
    },
  ],
};
