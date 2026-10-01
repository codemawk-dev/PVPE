// Formato das tabelas (espelha supabase/schema.sql).

type Timestamps = {
  created_at?: string;
  updated_at?: string;
};

export type Game = Timestamps & {
  id: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  event: string | null;
  result: string | null;
  played_at: string; // AAAA-MM-DD
};

export type Championship = Timestamps & {
  id: string;
  slug: string;
  name: string;
  starts_at: string | null; // ISO com fuso
  ends_at: string | null;
  date_label: string | null;
  time_label: string | null;
  location: string | null;
  description: string | null;
  teams_female: string[];
  teams_male: string[];
  registration_fee: string | null;
  registration_fee_note: string | null;
  registrations_open: boolean;
  prize_first: string | null;
  prize_first_extra: string | null;
  prize_second: string | null;
  logo_url: string | null;
  banner_url: string | null;
  featured: boolean;
};

export type Phone = Timestamps & {
  id: string;
  label: string;
  number: string; // só dígitos, com DDI 55
  is_primary: boolean;
};

export type Partner = Timestamps & {
  id: string;
  name: string;
  segment: string | null;
  logo_url: string | null;
  logo_full: boolean;
  link_url: string | null;
  sort_order: number;
};

export type Tables = {
  games: Game;
  championships: Championship;
  phones: Phone;
  partners: Partner;
};

export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T];

export type SiteData = {
  games: Game[];
  partners: Partner[];
  phones: Phone[];
  championships: Championship[];
};
