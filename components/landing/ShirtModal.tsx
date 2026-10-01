'use client';

// Modal "Solicitar camisa": escolhe modelo + tamanho e abre o WhatsApp com o pedido.
import { useEffect, useRef, useState } from 'react';
import { WhatsAppIcon } from '@/components/icons';
import { whatsappUrl } from '@/lib/format';
import { WA_MESSAGES } from '@/lib/messages';

const MODELS = ['Masculina', 'Feminina'];
const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

export function ShirtModal({ open, onClose, phone }: { open: boolean; onClose: () => void; phone: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [modelo, setModelo] = useState('');
  const [tamanho, setTamanho] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!modelo || !tamanho) return;
    window.open(whatsappUrl(phone, WA_MESSAGES.camisa(modelo, tamanho)), '_blank', 'noopener');
    setModelo('');
    setTamanho('');
    onClose();
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="shirt-title"
      onClose={onClose}
      onClick={(ev) => { if (ev.target === ref.current) onClose(); }}
    >
      <form className="modal-box" onSubmit={submit}>
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>&times;</button>
        <h3 id="shirt-title">SOLICITAR CAMISA</h3>
        <p className="modal-sub">Escolha o modelo e o tamanho. Vamos te levar para o WhatsApp com o pedido pronto.</p>

        <fieldset className="opt-group">
          <legend>MODELO</legend>
          <div className="opts opts--2">
            {MODELS.map((m) => (
              <label key={m} className="opt">
                <input type="radio" name="modelo" value={m} checked={modelo === m} onChange={() => setModelo(m)} required />
                <span>{m.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="opt-group">
          <legend>TAMANHO</legend>
          <div className="opts opts--sizes">
            {SIZES.map((s) => (
              <label key={s} className="opt">
                <input type="radio" name="tamanho" value={s} checked={tamanho === s} onChange={() => setTamanho(s)} required />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-yellow modal-submit" disabled={!modelo || !tamanho}>
          SOLICITAR CAMISA
          <WhatsAppIcon withPhone={false} />
        </button>
      </form>
    </dialog>
  );
}
