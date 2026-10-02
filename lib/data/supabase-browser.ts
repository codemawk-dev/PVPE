// Modo SUPABASE no navegador (painel): leitura, escrita, upload e login.
// Tabelas, RLS e bucket estão em supabase/schema.sql.
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config';
import type { Row, TableName } from '../types';
import type { DataAdapter, ListOptions } from './adapter';

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

export function createSupabaseAdapter(): DataAdapter {
  const sb = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  const { bucket } = supabaseConfig;

  return {
    mode: 'supabase',

    async list<T extends TableName>(table: T, { orderBy, ascending = true }: ListOptions = {}) {
      let q = sb.from(table).select('*');
      if (orderBy) q = q.order(orderBy, { ascending, nullsFirst: false });
      return check(await q) as Row<T>[];
    },

    async findBy<T extends TableName>(table: T, column: string, value: unknown) {
      return check(await sb.from(table).select('*').eq(column, value).maybeSingle()) as Row<T> | null;
    },

    async create<T extends TableName>(table: T, data: Partial<Row<T>>) {
      // sem tipos gerados do banco, o cliente não conhece as colunas: o tipo vem de lib/types.ts
      return check(await sb.from(table).insert(data as never).select().single()) as Row<T>;
    },

    async update<T extends TableName>(table: T, id: string, data: Partial<Row<T>>) {
      const rest = { ...data } as Record<string, unknown>;
      delete rest.id;
      delete rest.created_at;
      return check(await sb.from(table).update(rest).eq('id', id).select().single()) as Row<T>;
    },

    async remove(table, id) {
      check(await sb.from(table).delete().eq('id', id));
    },

    async uploadImage(file, folder = 'uploads') {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      check(await sb.storage.from(bucket).upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      }));
      return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },

    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession();
        return data.session?.user ?? null;
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error('E-mail ou senha incorretos.');
        return data.user;
      },
      async signOut() {
        await sb.auth.signOut();
      },
      async getAccessToken() {
        const { data } = await sb.auth.getSession();
        return data.session?.access_token ?? null;
      },
    },
  };
}
