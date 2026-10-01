// Formatadores usados pelo site e pelo painel.
import type { Phone } from './types';

export const TIMEZONE = 'America/Bahia';

// "assets/img/x.webp" -> "/assets/img/x.webp"; URLs completas e data: ficam como estão.
export function assetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return '/' + path.replace(/^\//, '');
}

export function onlyDigits(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '');
}

// Aceita "(73) 99133-5759" ou "73991335759" e devolve com DDI 55.
export function normalizePhone(v: unknown): string {
  const d = onlyDigits(v);
  if (!d) return '';
  return d.startsWith('55') && d.length >= 12 ? d : '55' + d;
}

export function formatPhone(v: unknown): string {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(v ?? '');
}

export function primaryPhone(phones: Phone[]): Phone | undefined {
  return phones.find((p) => p.is_primary) || phones[0];
}

export function whatsappUrl(number: string, text?: string): string {
  const base = `https://wa.me/${normalizePhone(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// "2027-03-01" -> "Março/2027"
export function formatMonthYear(date: string | null | undefined): string {
  const [y, m] = String(date ?? '').split('-');
  return y && m ? `${MONTHS[Number(m) - 1]}/${y}` : '';
}

// ISO (com fuso) -> "2026-11-28T08:00" no horário da Bahia, para <input type="datetime-local">
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso)).replace(' ', 'T');
}

// "2026-11-28T08:00" (horário da Bahia, UTC-3 o ano todo) -> ISO com fuso
export function fromLocalInput(value: string): string | null {
  return value ? `${value}:00-03:00` : null;
}

export function initials(name: string | null | undefined): string {
  return String(name ?? '')
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
