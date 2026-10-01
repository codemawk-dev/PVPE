// Adaptador SUPABASE: ativado automaticamente quando config.js tem URL e chave.
// Tabelas, RLS e bucket estão em supabase/schema.sql.
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function createSupabaseAdapter({ supabaseUrl, supabaseAnonKey, storageBucket }) {
  const { createClient } = await import(SDK_URL);
  const sb = createClient(supabaseUrl, supabaseAnonKey);

  return {
    mode: 'supabase',

    async list(table, { orderBy, ascending = true } = {}) {
      let q = sb.from(table).select('*');
      if (orderBy) q = q.order(orderBy, { ascending, nullsFirst: false });
      return check(await q);
    },

    async get(table, id) {
      return check(await sb.from(table).select('*').eq('id', id).maybeSingle());
    },

    async findBy(table, column, value) {
      return check(await sb.from(table).select('*').eq(column, value).maybeSingle());
    },

    async create(table, data) {
      return check(await sb.from(table).insert(data).select().single());
    },

    async update(table, id, data) {
      const { id: _ignore, created_at: _c, ...rest } = data;
      return check(await sb.from(table).update(rest).eq('id', id).select().single());
    },

    async remove(table, id) {
      check(await sb.from(table).delete().eq('id', id));
    },

    async uploadImage(file, folder = 'uploads') {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      check(await sb.storage.from(storageBucket).upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      }));
      return sb.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
    },

    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession();
        return data.session ? data.session.user : null;
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error('E-mail ou senha incorretos.');
        return data.user;
      },
      async signOut() {
        await sb.auth.signOut();
      },
    },
  };
}
