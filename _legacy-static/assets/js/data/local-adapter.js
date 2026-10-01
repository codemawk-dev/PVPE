// Adaptador LOCAL: guarda tudo no localStorage deste navegador.
// Mesma interface do supabase-adapter.js, para trocar sem mexer no resto do código.
import { seed } from './seed.js';

const KEY = 'pvpe:db:v1';
const clone = (v) => JSON.parse(JSON.stringify(v));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* storage indisponível ou corrompido: volta ao seed */ }
  return clone(seed);
}

// Ajusta dados salvos por versões anteriores do painel.
function migrate(state) {
  (state.championships || []).forEach((c) => {
    if (!('banner_url' in c)) {
      const original = seed.championships.find((s) => s.id === c.id);
      c.banner_url = original ? original.banner_url : '';
    }
  });
  return state;
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    throw new Error('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).');
  }
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }));

function sortRows(rows, orderBy, ascending) {
  if (!orderBy) return rows;
  return rows.sort((a, b) => {
    const x = a[orderBy], y = b[orderBy];
    if (x === y) return 0;
    if (x === undefined || x === null || x === '') return 1;
    if (y === undefined || y === null || y === '') return -1;
    return (x > y ? 1 : -1) * (ascending ? 1 : -1);
  });
}

// Reduz a imagem e devolve um data URL (o localStorage tem ~5 MB no total).
function fileToDataUrl(file, maxSize = 600) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      return fr.readAsDataURL(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida.')); };
    img.src = url;
  });
}

export function createLocalAdapter() {
  return {
    mode: 'local',

    async list(table, { orderBy, ascending = true } = {}) {
      return sortRows(clone(load()[table] || []), orderBy, ascending);
    },

    async get(table, id) {
      return clone((load()[table] || []).find((r) => r.id === id) || null);
    },

    async findBy(table, column, value) {
      return clone((load()[table] || []).find((r) => r[column] === value) || null);
    },

    async create(table, data) {
      const state = load();
      const row = { ...data, id: uuid(), created_at: new Date().toISOString() };
      state[table] = [...(state[table] || []), row];
      save(state);
      return clone(row);
    },

    async update(table, id, data) {
      const state = load();
      const rows = state[table] || [];
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error('Registro não encontrado.');
      rows[i] = { ...rows[i], ...data, id, updated_at: new Date().toISOString() };
      save(state);
      return clone(rows[i]);
    },

    async remove(table, id) {
      const state = load();
      state[table] = (state[table] || []).filter((r) => r.id !== id);
      save(state);
    },

    async uploadImage(file) {
      return fileToDataUrl(file);
    },

    // Volta para o conteúdo original do site (só existe no modo local).
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
