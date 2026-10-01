'use client';

// Acesso aos dados no navegador: escolhe o modo conforme as variáveis de ambiente.
// O SDK do Supabase só é baixado quando ele está configurado.
import { isSupabaseConfigured } from '../config';
import type { DataAdapter } from './adapter';
import { createLocalAdapter } from './local';

let dbPromise: Promise<DataAdapter> | undefined;

export function getDb(): Promise<DataAdapter> {
  if (!dbPromise) {
    dbPromise = isSupabaseConfigured
      ? import('./supabase-browser').then((m) => m.createSupabaseAdapter())
      : Promise.resolve(createLocalAdapter());
  }
  return dbPromise;
}
