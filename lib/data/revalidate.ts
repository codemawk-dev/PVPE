'use server';

// Chamada pelo painel depois de criar, editar ou excluir: descarta o cache das
// páginas públicas para a alteração aparecer na hora (sem esperar os 60 s do
// `revalidate`). Só aceita quem está logado no Supabase.
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, supabaseConfig } from '../config';

export async function revalidateSite(accessToken: string | null): Promise<void> {
  // modo local: as páginas não leem do banco, não há cache para limpar
  if (!isSupabaseConfigured) return;

  if (!accessToken) throw new Error('Sessão expirada: faça login novamente.');
  const sb = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) throw new Error('Sessão expirada: faça login novamente.');

  // layout raiz = página inicial e todas as páginas de campeonato
  revalidatePath('/', 'layout');
}
