import { getDb, assetUrl, escapeHtml as e, toLocalInput, fromLocalInput } from '../data/store.js';
import { resources } from './resources.js';

const $ = (sel) => document.querySelector(sel);
const NAV_ICONS = { games: '🏐', championships: '🏆', phones: '☎', partners: '🤝' };

let db;
let current = 'games';
let rows = [];
let editing = null; // registro em edição (null = novo)

// ---------------------------------------------------------------- boot
init().catch((err) => {
  $('#boot').innerHTML = `<span class="form-error">Erro ao iniciar o painel: ${e(err.message)}</span>`;
});

async function init() {
  db = await getDb();
  $('#boot').hidden = true;

  if (db.mode === 'supabase' && !(await db.auth.getUser())) {
    showLogin();
  } else {
    showApp();
  }
}

function showLogin() {
  $('#login').hidden = false;
  $('#login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    const err = $('#login-error');
    err.hidden = true;
    setBusy(f.querySelector('button[type=submit]'), true);
    try {
      await db.auth.signIn(f.email.value.trim(), f.password.value);
      $('#login').hidden = true;
      showApp();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally {
      setBusy(f.querySelector('button[type=submit]'), false);
    }
  });
}

function showApp() {
  $('#app').hidden = false;
  const local = db.mode === 'local';
  $('#mode-badge').textContent = local ? '● Modo local' : '● Supabase conectado';
  $('#mode-badge').classList.toggle('is-online', !local);
  $('#local-warning').hidden = !local;
  $('#reset-btn').hidden = !local;
  $('#logout-btn').hidden = local;

  $('#nav').innerHTML = Object.entries(resources).map(([key, r]) =>
    `<a href="#${key}" data-key="${key}"><span>${NAV_ICONS[key]}</span>${e(r.title)}</a>`).join('');

  $('#new-btn').addEventListener('click', () => openForm(null));
  $('#logout-btn').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });
  $('#reset-btn').addEventListener('click', async () => {
    if (!confirm('Apagar todas as alterações feitas neste navegador e voltar ao conteúdo original do site?')) return;
    await db.reset();
    toast('Dados originais restaurados.');
    loadList();
  });
  $('#list').addEventListener('click', onListClick);
  setupDrawer();

  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const key = location.hash.slice(1);
  current = resources[key] ? key : 'games';
  const r = resources[current];
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.key === current));
  $('#view-title').textContent = r.title;
  $('#view-desc').textContent = r.desc;
  $('#new-btn').textContent = `+ Novo ${r.singular}`;
  document.title = `${r.title} · Painel PVPE`;
  loadList();
}

// ---------------------------------------------------------------- lista
async function loadList() {
  const r = resources[current];
  const list = $('#list');
  list.innerHTML = '<p class="empty">Carregando…</p>';
  try {
    rows = await db.list(r.table, { orderBy: r.orderBy, ascending: r.ascending });
  } catch (ex) {
    list.innerHTML = `<p class="empty form-error">Erro ao carregar: ${e(ex.message)}</p>`;
    return;
  }
  if (!rows.length) {
    list.innerHTML = `<p class="empty">Nenhum ${r.singular} cadastrado ainda.</p>`;
    return;
  }
  list.innerHTML = rows.map((row) => `
    <article class="row" data-id="${e(row.id)}">
      ${r.row(row)}
      <div class="row-actions">
        <button type="button" class="a-btn a-btn--sm" data-action="edit">Editar</button>
        <button type="button" class="a-btn a-btn--sm a-btn--danger" data-action="delete">Excluir</button>
      </div>
    </article>`).join('');
}

async function onListClick(ev) {
  const btn = ev.target.closest('[data-action]');
  if (!btn) return;
  const row = rows.find((x) => x.id === btn.closest('.row').dataset.id);
  const r = resources[current];
  if (btn.dataset.action === 'edit') return openForm(row);

  const name = row.name || row.label || `${row.team_home} x ${row.team_away}`;
  if (!confirm(`Excluir ${r.singular} "${name}"? Essa ação não pode ser desfeita.`)) return;
  setBusy(btn, true);
  try {
    await db.remove(r.table, row.id);
    toast(`${cap(r.singular)} excluído.`);
    loadList();
  } catch (ex) {
    toast(`Erro ao excluir: ${ex.message}`, true);
    setBusy(btn, false);
  }
}

// ---------------------------------------------------------------- formulário
function setupDrawer() {
  const drawer = $('#drawer');
  drawer.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => drawer.close()));
  drawer.addEventListener('click', (ev) => { if (ev.target === drawer) drawer.close(); });
  $('#drawer-form').addEventListener('submit', onSave);
}

function openForm(row) {
  editing = row;
  const r = resources[current];
  $('#drawer-title').textContent = row ? `Editar ${r.singular}` : `Novo ${r.singular}`;
  $('#form-error').hidden = true;
  $('#drawer-body').innerHTML = r.fields.map((f) => renderField(f, row)).join('');
  bindImageFields();
  $('#drawer').showModal();
  const first = $('#drawer-body').querySelector('input:not([type=checkbox]):not([type=file]), textarea');
  if (first) first.focus();
}

function renderField(f, row) {
  if (f.group) return `<h3 class="field-group">${e(f.group)}</h3>`;

  let v = row ? row[f.name] : f.default;
  if (v === undefined || v === null) v = '';
  const id = `f-${f.name}`;
  const req = f.required ? ' required' : '';
  const help = f.help ? `<small class="help">${e(f.help)}</small>` : '';
  const cls = `field${f.half ? ' field--half' : ''}`;
  const label = `${e(f.label)}${f.required ? ' <b>*</b>' : ''}`;

  switch (f.type) {
    case 'checkbox':
      return `<label class="${cls} field--check">
          <input type="checkbox" name="${f.name}" id="${id}"${v ? ' checked' : ''}>
          <span><strong>${e(f.label)}</strong>${help}</span>
        </label>`;

    case 'textarea':
    case 'lines': {
      const text = Array.isArray(v) ? v.join('\n') : v;
      return `<label class="${cls}" for="${id}"><span>${label}</span>
          <textarea name="${f.name}" id="${id}" rows="${f.rows || (f.type === 'lines' ? 7 : 4)}"${req}>${e(text)}</textarea>${help}</label>`;
    }

    case 'image':
      return `<div class="${cls} field--image${f.wide ? ' field--wide' : ''}" data-image="${f.name}">
          <span>${label}</span>
          <div class="img-box">
            <div class="img-preview">${v ? `<img src="${e(assetUrl(v))}" alt="">` : '<span>Sem imagem</span>'}</div>
            <div class="img-controls">
              <label class="a-btn a-btn--sm">Enviar imagem
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>
              </label>
              <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-clear-image>Remover</button>
              <input type="hidden" name="${f.name}" value="${e(v)}">
            </div>
          </div>${help}
        </div>`;

    default: {
      const types = { text: 'text', number: 'number', date: 'date', datetime: 'datetime-local', tel: 'tel', url: 'url' };
      if (f.type === 'datetime') v = toLocalInput(v);
      if (f.format && v) v = f.format(v);
      const attrs = [
        f.placeholder ? `placeholder="${e(f.placeholder)}"` : '',
        f.min !== undefined ? `min="${f.min}"` : '',
        f.max !== undefined ? `max="${f.max}"` : '',
        f.pattern ? `pattern="${e(f.pattern)}"` : '',
      ].join(' ');
      const input = `<input type="${types[f.type] || 'text'}" name="${f.name}" id="${id}" value="${e(v)}" ${attrs}${req}>`;
      return `<label class="${cls}" for="${id}"><span>${label}</span>
          ${f.prefix ? `<div class="input-prefix"><em>${e(f.prefix)}</em>${input}</div>` : input}${help}</label>`;
    }
  }
}

// imagem escolhida fica guardada aqui até salvar
const pendingFiles = new Map();

function bindImageFields() {
  pendingFiles.clear();
  document.querySelectorAll('[data-image]').forEach((box) => {
    const name = box.dataset.image;
    const preview = box.querySelector('.img-preview');
    const hidden = box.querySelector('input[type=hidden]');
    box.querySelector('input[type=file]').addEventListener('change', (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('Imagem muito grande (máx. 5 MB).', true); return; }
      pendingFiles.set(name, file);
      preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`;
    });
    box.querySelector('[data-clear-image]').addEventListener('click', () => {
      pendingFiles.delete(name);
      hidden.value = '';
      preview.innerHTML = '<span>Sem imagem</span>';
    });
  });
}

function readForm(form, fields) {
  const data = {};
  for (const f of fields) {
    if (!f.name) continue;
    const el = form.elements[f.name];
    if (f.type === 'checkbox') data[f.name] = el.checked;
    else if (f.type === 'number') data[f.name] = el.value === '' ? 0 : Number(el.value);
    else if (f.type === 'lines') data[f.name] = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'datetime') data[f.name] = fromLocalInput(el.value);
    else if (f.type === 'date') data[f.name] = el.value || null;
    else data[f.name] = el.value.trim();
  }
  return data;
}

async function onSave(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  const r = resources[current];
  const err = $('#form-error');
  err.hidden = true;

  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    const label = bad.closest('.field')?.querySelector('span')?.textContent.replace('*', '').trim();
    err.textContent = `Confira o campo "${label}".`;
    err.hidden = false;
    bad.focus();
    return;
  }

  const btn = $('#save-btn');
  setBusy(btn, true);
  try {
    let data = readForm(form, r.fields);
    for (const [name, file] of pendingFiles) {
      const folder = r.fields.find((f) => f.name === name).folder;
      data[name] = await db.uploadImage(file, folder);
    }
    if (r.beforeSave) data = r.beforeSave(data);

    // campos exclusivos (destaque / principal): desmarca nos outros registros
    if (r.exclusiveFlag && data[r.exclusiveFlag]) {
      const all = await db.list(r.table);
      for (const other of all) {
        if (other[r.exclusiveFlag] && other.id !== editing?.id) {
          await db.update(r.table, other.id, { [r.exclusiveFlag]: false });
        }
      }
    }

    if (editing) await db.update(r.table, editing.id, data);
    else await db.create(r.table, data);

    $('#drawer').close();
    toast(`${cap(r.singular)} ${editing ? 'atualizado' : 'criado'}.`);
    loadList();
  } catch (ex) {
    err.textContent = friendlyError(ex.message);
    err.hidden = false;
  } finally {
    setBusy(btn, false);
  }
}

function friendlyError(msg) {
  if (/duplicate key.*slug/i.test(msg)) return 'Já existe um campeonato com esse endereço.';
  if (/row-level security/i.test(msg)) return 'Sem permissão: faça login novamente.';
  return msg;
}

// ---------------------------------------------------------------- utilitários
function setBusy(btn, busy) {
  btn.disabled = busy;
  btn.classList.toggle('is-busy', busy);
}

function toast(msg, isError = false) {
  const t = document.createElement('div');
  t.className = `toast${isError ? ' toast--error' : ''}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('is-out'), 3200);
  setTimeout(() => t.remove(), 3600);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
