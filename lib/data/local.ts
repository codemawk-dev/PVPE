// Modo LOCAL: guarda tudo no localStorage deste navegador.
import { seed } from '../seed';
import type { Row, SiteData, TableName } from '../types';
import type { DataAdapter, ListOptions } from './adapter';

const KEY = 'pvpe:db:v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function load(): SiteData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    /* storage indisponível ou corrompido: volta aos dados iniciais */
  }
  return clone(seed);
}

// Ajusta dados salvos por versões anteriores do painel.
function migrate(state: SiteData): SiteData {
  for (const c of state.championships || []) {
    if (!('banner_url' in c)) {
      (c as { banner_url: string | null }).banner_url =
        seed.championships.find((s) => s.id === (c as { id: string }).id)?.banner_url ?? null;
    }
  }
  return state;
}

function save(state: SiteData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    throw new Error('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).');
  }
}

type AnyRow = Record<string, unknown> & { id: string };

function sortRows<T>(rows: T[], { orderBy, ascending = true }: ListOptions = {}): T[] {
  if (!orderBy) return rows;
  return rows.sort((a, b) => {
    const x = (a as Record<string, unknown>)[orderBy] as string | number | null | undefined;
    const y = (b as Record<string, unknown>)[orderBy] as string | number | null | undefined;
    if (x === y) return 0;
    if (x === undefined || x === null || x === '') return 1;
    if (y === undefined || y === null || y === '') return -1;
    return (x > y ? 1 : -1) * (ascending ? 1 : -1);
  });
}

// Reduz a imagem e devolve um data URL (o localStorage tem ~5 MB no total).
function fileToDataUrl(file: File, maxSize = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida.'));
    };
    img.src = url;
  });
}

export function createLocalAdapter(): DataAdapter {
  const rowsOf = (state: SiteData, table: TableName) => (state[table] || []) as unknown as AnyRow[];

  return {
    mode: 'local',

    async list<T extends TableName>(table: T, opts?: ListOptions) {
      return sortRows(clone(rowsOf(load(), table)), opts) as unknown as Row<T>[];
    },

    async findBy<T extends TableName>(table: T, column: string, value: unknown) {
      const row = rowsOf(load(), table).find((r) => r[column] === value);
      return (row ? clone(row) : null) as Row<T> | null;
    },

    async create<T extends TableName>(table: T, data: Partial<Row<T>>) {
      const state = load();
      const row = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() } as AnyRow;
      (state[table] as unknown as AnyRow[]) = [...rowsOf(state, table), row];
      save(state);
      return clone(row) as unknown as Row<T>;
    },

    async update<T extends TableName>(table: T, id: string, data: Partial<Row<T>>) {
      const state = load();
      const rows = rowsOf(state, table);
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error('Registro não encontrado.');
      rows[i] = { ...rows[i], ...data, id, updated_at: new Date().toISOString() };
      save(state);
      return clone(rows[i]) as unknown as Row<T>;
    },

    async remove(table, id) {
      const state = load();
      (state[table] as unknown as AnyRow[]) = rowsOf(state, table).filter((r) => r.id !== id);
      save(state);
    },

    async uploadImage(file) {
      return fileToDataUrl(file);
    },

    async reset() {
      localStorage.removeItem(KEY);
    },

    // Sem backend não existe login de verdade: o painel fica liberado neste navegador.
    auth: {
      async getUser() { return { email: 'modo-local' }; },
      async signIn() { return { email: 'modo-local' }; },
      async signOut() {},
    },
  };
}
