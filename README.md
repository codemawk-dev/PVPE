# PVPE — Projeto de Vôlei Pedro Eduardo

Site do PVPE com painel administrativo, feito em **Next.js 16** (App Router + TypeScript).

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

| Rota | O que é |
|---|---|
| `/` | Página inicial |
| `/[slug]` | Página de cada campeonato cadastrado (ex.: `/copa-do-mel`) |
| `/campeonato` | Redireciona para o campeonato em destaque (e aceita o formato antigo `?c=slug`) |
| `/p-admin` | Painel: jogos, campeonatos, telefones e parceiros |

## Dados: modo local × Supabase

Sem configuração, o projeto roda em **modo local**:

- as páginas usam os dados iniciais de `lib/seed.ts`;
- o painel salva as alterações no `localStorage` do navegador (só quem editou vê);
- o painel não pede login.

### Conectar o Supabase

1. Rode `supabase/schema.sql` no SQL Editor do projeto (cria tabelas, RLS, bucket de imagens e os dados iniciais).
2. Copie `.env.example` para `.env.local` e preencha a URL e a chave `anon` (Project Settings → API).
3. Crie o usuário admin em Authentication → Users e **desative novos cadastros**
   (Authentication → Providers → Email → "Allow new users to sign up"): qualquer usuário logado pode editar.
4. Reinicie o `npm run dev`. O painel passa a pedir login e o site lê do banco
   (as páginas se atualizam em até 60 segundos após uma alteração).

## Estrutura

```
app/                  rotas (página inicial, campeonato, painel, 404) e CSS em app/styles
components/landing/   seções da página inicial e o modal da camisa
components/championship/  página-modelo do campeonato e o contador
components/admin/     painel (resources.tsx define os campos de cada seção)
lib/                  tipos, dados iniciais, formatadores e camada de dados
  data/server.ts      leitura no servidor (Supabase ou seed)
  data/client.ts      leitura/escrita no navegador (Supabase ou localStorage)
public/assets/img/    imagens
supabase/schema.sql   banco de dados
_legacy-static/       versão estática anterior (HTML/CSS/JS), só como referência
```

Para adicionar um campo: `lib/types.ts`, `components/admin/resources.tsx` e a coluna em `supabase/schema.sql`.
