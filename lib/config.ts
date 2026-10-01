// Configuração do Supabase via variáveis de ambiente (.env.local).
// Enquanto estiverem vazias, o site usa os dados iniciais (lib/seed.ts) e o
// painel funciona em MODO LOCAL (dados salvos só no navegador).
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'pvpe',
};

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
