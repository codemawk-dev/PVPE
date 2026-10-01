// Configuração do backend.
//
// Enquanto supabaseUrl/supabaseAnonKey estiverem vazios, o site e o painel
// funcionam em MODO LOCAL: os dados ficam no navegador (localStorage).
//
// Para conectar ao Supabase:
//   1. Rode supabase/schema.sql no SQL Editor do projeto.
//   2. Preencha os dois campos abaixo (Project Settings → API).
//   3. Crie o usuário admin em Authentication → Users.
// A chave "anon" é pública por natureza; a segurança fica nas políticas RLS do schema.
export const config = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  storageBucket: 'pvpe',
};
