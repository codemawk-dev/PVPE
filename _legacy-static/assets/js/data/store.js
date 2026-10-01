// Ponto único de acesso aos dados: escolhe o adaptador conforme config.js
// e reúne os formatadores usados pelo site e pelo painel.
import { config } from '../config.js';
import { createLocalAdapter } from './local-adapter.js';

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (config.supabaseUrl && config.supabaseAnonKey)
      ? import('./supabase-adapter.js').then((m) => m.createSupabaseAdapter(config))
      : Promise.resolve(createLocalAdapter());
  }
  return dbPromise;
}

// Raiz do site, calculada a partir deste arquivo (assets/js/data/store.js),
// para que caminhos como "assets/img/x.webp" funcionem em qualquer página.
const SITE_ROOT = new URL('../../../', import.meta.url).href;

export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return SITE_ROOT + path.replace(/^\//, '');
}

export const TIMEZONE = 'America/Bahia';

export function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '');
}

// Aceita "(73) 99133-5759" ou "73991335759" e devolve com DDI 55.
export function normalizePhone(v) {
  const d = onlyDigits(v);
  if (!d) return '';
  return d.startsWith('55') && d.length >= 12 ? d : '55' + d;
}

export function formatPhone(v) {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || '';
}

export function whatsappUrl(number, text) {
  const base = `https://wa.me/${normalizePhone(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// "2027-03-01" -> "Março/2027"
export function formatMonthYear(date) {
  const [y, m] = String(date || '').split('-');
  return y && m ? `${MONTHS[Number(m) - 1]}/${y}` : '';
}

// ISO (com fuso) -> "2026-11-28T08:00" no horário da Bahia, para <input type="datetime-local">
export function toLocalInput(iso) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}

// "2026-11-28T08:00" (horário da Bahia, UTC-3 o ano todo) -> ISO com fuso
export function fromLocalInput(value) {
  return value ? `${value}:00-03:00` : null;
}

export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
