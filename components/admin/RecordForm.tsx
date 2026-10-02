'use client';

import { useEffect, useRef, useState } from 'react';
import { assetUrl, fromLocalInput, toLocalInput } from '@/lib/format';
import type { Field, FieldOrGroup, Resource } from './resources';

type Props = {
  resource: Resource;
  record: Record<string, unknown> | null; // null = novo
  onCancel: () => void;
  onSubmit: (data: Record<string, unknown>, files: Map<string, File>) => Promise<void>;
};

export function RecordForm({ resource, record, onCancel, onSubmit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  // arquivos escolhidos nos campos de imagem, enviados só ao salvar
  const [files] = useState(() => new Map<string, File>());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = dialog.current!;
    d.showModal();
    form.current?.querySelector<HTMLElement>('input:not([type=checkbox]):not([type=file]):not([type=hidden]), textarea')?.focus();
    return () => { if (d.open) d.close(); };
  }, []);

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const el = ev.currentTarget;
    setError('');

    if (!el.checkValidity()) {
      const bad = el.querySelector<HTMLInputElement>(':invalid')!;
      const label = bad.closest('.field')?.querySelector('span')?.textContent?.replace('*', '').trim();
      setError(`Confira o campo "${label}".`);
      bad.focus();
      return;
    }

    setBusy(true);
    try {
      await onSubmit(readForm(el, resource.fields), files);
    } catch (ex) {
      setError(friendlyError((ex as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="drawer-title"
      onCancel={(ev) => { ev.preventDefault(); onCancel(); }}
    >
      <form ref={form} className="drawer-box" noValidate onSubmit={handleSubmit}>
        <header className="drawer-head">
          <h2 id="drawer-title">{record ? 'Editar' : 'Novo'} {resource.singular}</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onCancel}>&times;</button>
        </header>

        <div className="drawer-body">
          {resource.fields.map((f, i) => (
            'group' in f
              ? <h3 key={`g-${i}`} className="field-group">{f.group}</h3>
              : <FieldInput key={f.name} field={f} value={record ? record[f.name] : f.default} files={files} />
          ))}
        </div>

        <footer className="drawer-foot">
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="a-btn" onClick={onCancel}>Cancelar</button>
          <button type="submit" className={`a-btn a-btn--primary${busy ? ' is-busy' : ''}`} disabled={busy}>Salvar</button>
        </footer>
      </form>
    </dialog>
  );
}

function FieldInput({ field: f, value, files }: { field: Field; value: unknown; files: Map<string, File> }) {
  const id = `f-${f.name}`;
  const cls = `field${f.half ? ' field--half' : ''}`;
  const help = f.help && <small className="help">{f.help}</small>;
  const label = <span>{f.label}{f.required && <> <b>*</b></>}</span>;

  if (f.type === 'checkbox') {
    return (
      <label className={`${cls} field--check`}>
        <input type="checkbox" name={f.name} id={id} defaultChecked={Boolean(value)} />
        <span><strong>{f.label}</strong>{help}</span>
      </label>
    );
  }

  if (f.type === 'textarea' || f.type === 'lines') {
    const text = Array.isArray(value) ? value.join('\n') : String(value ?? '');
    return (
      <label className={cls} htmlFor={id}>
        {label}
        <textarea name={f.name} id={id} rows={f.rows ?? (f.type === 'lines' ? 7 : 4)} required={f.required} defaultValue={text} />
        {help}
      </label>
    );
  }

  if (f.type === 'image') {
    return <ImageInput field={f} initial={String(value ?? '')} files={files} className={cls} label={label} help={help} />;
  }

  const types: Record<string, string> = { datetime: 'datetime-local' };
  let v = value ?? '';
  if (f.type === 'datetime') v = toLocalInput(v as string);
  if (f.format && v) v = f.format(v);
  const input = (
    <input
      type={types[f.type] ?? f.type}
      name={f.name}
      id={id}
      defaultValue={String(v)}
      placeholder={f.placeholder}
      min={f.min}
      max={f.max}
      pattern={f.pattern}
      required={f.required}
    />
  );
  return (
    <label className={cls} htmlFor={id}>
      {label}
      {f.prefix ? <div className="input-prefix"><em>{f.prefix}</em>{input}</div> : input}
      {help}
    </label>
  );
}

function ImageInput({ field: f, initial, files, className, label, help }: {
  field: Field; initial: string; files: Map<string, File>;
  className: string; label: React.ReactNode; help: React.ReactNode;
}) {
  const [url, setUrl] = useState(initial);
  const [preview, setPreview] = useState(assetUrl(initial));

  function choose(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande (máx. 5 MB).');
      return;
    }
    files.set(f.name, file);
    setPreview(URL.createObjectURL(file));
  }

  function clear() {
    files.delete(f.name);
    setUrl('');
    setPreview('');
  }

  return (
    <div className={`${className} field--image${f.wide ? ' field--wide' : ''}`}>
      {label}
      <div className="img-box">
        <div className="img-preview">{preview ? <img src={preview} alt="" /> : <span>Sem imagem</span>}</div>
        <div className="img-controls">
          <label className="a-btn a-btn--sm">
            Enviar imagem
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={choose} />
          </label>
          <button type="button" className="a-btn a-btn--sm a-btn--ghost" onClick={clear}>Remover</button>
          <input type="hidden" name={f.name} value={url} />
        </div>
      </div>
      {help}
    </div>
  );
}

function readForm(form: HTMLFormElement, fields: FieldOrGroup[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    if ('group' in f) continue;
    const el = form.elements.namedItem(f.name) as HTMLInputElement | HTMLTextAreaElement;
    const value = el.value;
    switch (f.type) {
      case 'checkbox': data[f.name] = (el as HTMLInputElement).checked; break;
      case 'number': data[f.name] = value === '' ? 0 : Number(value); break;
      case 'lines': data[f.name] = value.split('\n').map((s) => s.trim()).filter(Boolean); break;
      case 'datetime': data[f.name] = fromLocalInput(value); break;
      case 'date': data[f.name] = value || null; break;
      default: data[f.name] = value.trim() || (f.required ? '' : null);
    }
  }
  return data;
}

function friendlyError(msg: string) {
  if (/duplicate key.*slug/i.test(msg)) return 'Já existe um campeonato com esse endereço.';
  if (/row-level security/i.test(msg)) return 'Sem permissão: faça login novamente.';
  return msg;
}
