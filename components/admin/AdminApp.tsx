'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getDb } from '@/lib/data/client';
import { revalidateSite } from '@/lib/data/revalidate';
import type { DataAdapter } from '@/lib/data/adapter';
import type { TableName } from '@/lib/types';
import { RecordForm } from './RecordForm';
import { resourceKeys, resources } from './resources';

type AnyRow = Record<string, unknown> & { id: string };
type Toast = { id: number; msg: string; error?: boolean };

// seção atual vem do #hash (ex.: /p-admin#partners)
function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
function useCurrentResource(): TableName {
  const hash = useSyncExternalStore(subscribeHash, () => location.hash.slice(1), () => '');
  return (resourceKeys as string[]).includes(hash) ? (hash as TableName) : 'games';
}

export function AdminApp() {
  const [db, setDb] = useState<DataAdapter | null>(null);
  const [authed, setAuthed] = useState(false);
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    getDb()
      .then(async (d) => {
        const user = d.mode === 'local' || (await d.auth.getUser());
        setDb(d);
        setAuthed(Boolean(user));
      })
      .catch((err) => setBootError((err as Error).message));
  }, []);

  if (bootError) return <div className="admin-root boot"><span className="form-error">Erro ao iniciar o painel: {bootError}</span></div>;
  if (!db) {
    return (
      <div className="admin-root boot">
        <img src="/assets/img/logo-pvpe.png" alt="" />
        <span>Carregando painel…</span>
      </div>
    );
  }
  if (!authed) return <Login db={db} onLogin={() => setAuthed(true)} />;
  return <Panel db={db} />;
}

function Login({ db, onLogin }: { db: DataAdapter; onLogin: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    setError('');
    setBusy(true);
    try {
      await db.auth.signIn(String(f.get('email')).trim(), String(f.get('password')));
      onLogin();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-root login">
      <form className="login-box" onSubmit={submit}>
        <img src="/assets/img/logo-pvpe.png" alt="PVPE" className="login-logo" />
        <h1>Painel PVPE</h1>
        <p>Entre com o e-mail e a senha de administrador.</p>
        <label className="field">
          <span>E-mail</span>
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className={`a-btn a-btn--primary a-btn--block${busy ? ' is-busy' : ''}`} disabled={busy}>Entrar</button>
        <Link href="/" className="login-back">← Voltar ao site</Link>
      </form>
    </main>
  );
}

function Panel({ db }: { db: DataAdapter }) {
  const current = useCurrentResource();
  const r = resources[current];
  const local = db.mode === 'local';

  // linhas guardadas junto com a seção a que pertencem: trocar de seção = "carregando"
  const [list, setList] = useState<{ key: string; rows: AnyRow[]; error?: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<{ record: AnyRow | null } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((msg: string, error = false) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  useEffect(() => {
    document.title = `${r.title} · Painel PVPE`;
    let alive = true;
    db.list(r.table, { orderBy: r.orderBy, ascending: r.ascending })
      .then((rows) => { if (alive) setList({ key: `${current}:${reload}`, rows: rows as unknown as AnyRow[] }); })
      .catch((err) => { if (alive) setList({ key: `${current}:${reload}`, rows: [], error: (err as Error).message }); });
    return () => { alive = false; };
  }, [db, r, current, reload]);

  const loading = !list || list.key !== `${current}:${reload}`;
  const refresh = () => setReload((n) => n + 1);

  // Atualiza as páginas públicas na hora, sem travar o painel enquanto isso.
  function publish() {
    if (db.mode !== 'supabase') return;
    db.auth.getAccessToken()
      .then(revalidateSite)
      .catch((err) => toast(`Salvo, mas o site pode levar até 1 minuto para atualizar (${(err as Error).message}).`, true));
  }

  async function save(data: Record<string, unknown>, files: Map<string, File>) {
    const record = editing?.record ?? null;
    for (const [name, file] of files) {
      const field = r.fields.find((f) => 'name' in f && f.name === name);
      data[name] = await db.uploadImage(file, field && 'folder' in field ? field.folder : undefined);
    }
    if (r.beforeSave) data = r.beforeSave(data);

    // só busca os outros registros quando há regra que depende deles
    const flag = r.exclusiveFlag;
    if (r.unique || (flag && data[flag])) {
      const others = ((await db.list(r.table)) as unknown as AnyRow[]).filter((o) => o.id !== record?.id);
      if (r.unique && others.some((o) => o[r.unique!.field] === data[r.unique!.field])) {
        throw new Error(r.unique.message);
      }
      // destaque / principal: desmarca nos outros registros
      if (flag && data[flag]) {
        await Promise.all(others.filter((o) => o[flag]).map((o) => db.update(r.table, o.id, { [flag]: false })));
      }
    }

    if (record) await db.update(r.table, record.id, data);
    else await db.create(r.table, data);

    setEditing(null);
    toast(`${cap(r.singular)} ${record ? 'atualizado' : 'criado'}.`);
    refresh();
    publish();
  }

  async function remove(row: AnyRow) {
    if (!confirm(`Excluir ${r.singular} "${r.label(row as never)}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await db.remove(r.table, row.id);
      toast(`${cap(r.singular)} excluído.`);
      refresh();
      publish();
    } catch (ex) {
      toast(`Erro ao excluir: ${(ex as Error).message}`, true);
    }
  }

  async function resetLocal() {
    if (!confirm('Apagar todas as alterações feitas neste navegador e voltar ao conteúdo original do site?')) return;
    await db.reset?.();
    toast('Dados originais restaurados.');
    refresh();
  }

  async function logout() {
    await db.auth.signOut();
    location.reload();
  }

  return (
    <div className="admin-root app">
      <aside className="sidebar">
        <a href="#games" className="side-brand">
          <img src="/assets/img/logo-pvpe.png" alt="" />
          <span>PVPE <small>Painel</small></span>
        </a>
        <nav className="side-nav">
          {resourceKeys.map((key) => (
            <a key={key} href={`#${key}`} className={key === current ? 'is-active' : undefined}>
              <span>{resources[key].icon}</span>{resources[key].title}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener" className="side-link">Ver site ↗</a>
          {local && <button type="button" className="side-link" onClick={resetLocal}>Restaurar dados originais</button>}
          {!local && <button type="button" className="side-link" onClick={logout}>Sair</button>}
        </div>
      </aside>

      <main className="content">
        {local && (
          <div className="local-warning">
            <strong>Modo local.</strong> O Supabase ainda não está conectado: as alterações ficam salvas só neste
            navegador e aparecem no site apenas aqui. Para publicar de verdade, preencha o <code>.env.local</code>
            (veja o <code>.env.example</code>).
          </div>
        )}

        <header className="content-head">
          <div>
            <h1>{r.title}</h1>
            <p>{r.desc}</p>
          </div>
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing({ record: null })}>
            + Novo {r.singular}
          </button>
        </header>

        <section className="list" aria-live="polite">
          {loading && <p className="empty">Carregando…</p>}
          {!loading && list.error && <p className="empty form-error">Erro ao carregar: {list.error}</p>}
          {!loading && !list.error && !list.rows.length && <p className="empty">Nenhum {r.singular} cadastrado ainda.</p>}
          {!loading && list.rows.map((row) => (
            <article key={row.id} className="row">
              {r.render(row as never)}
              <div className="row-actions">
                <button type="button" className="a-btn a-btn--sm" onClick={() => setEditing({ record: row })}>Editar</button>
                <button type="button" className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(row)}>Excluir</button>
              </div>
            </article>
          ))}
        </section>
      </main>

      {editing && (
        <RecordForm
          key={`${current}:${editing.record?.id ?? 'new'}`}
          resource={r}
          record={editing.record}
          onCancel={() => setEditing(null)}
          onSubmit={save}
        />
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast${t.error ? ' toast--error' : ''}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
