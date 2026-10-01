'use client';

// Contador até o início do campeonato. Usa um "relógio" externo que avança a cada
// segundo: no servidor não há horário (mostra "--"), no navegador assume a hora real.
import { Fragment, useSyncExternalStore } from 'react';

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverNow = () => null;

const pad = (n: number) => String(n).padStart(2, '0');

export function Countdown({ startsAt, endsAt }: { startsAt: string; endsAt: string | null }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, serverNow);
  const start = Math.floor(new Date(startsAt).getTime() / 1000);
  const end = Math.floor(new Date(endsAt || startsAt).getTime() / 1000);

  const state = now === null ? 'waiting' : now >= Math.max(start, end) ? 'over' : now >= start ? 'live' : 'waiting';
  const left = now === null ? null : Math.max(0, start - now);
  const units: [string, string][] = [
    ['DIAS', left === null ? '--' : pad(Math.floor(left / 86400))],
    ['HORAS', left === null ? '--' : pad(Math.floor((left % 86400) / 3600))],
    ['MIN', left === null ? '--' : pad(Math.floor((left % 3600) / 60))],
    ['SEG', left === null ? '--' : pad(left % 60)],
  ];

  return (
    <div className={`countdown${state === 'live' ? ' is-live' : ''}${state === 'over' ? ' is-over' : ''}`} role="timer">
      <span className="countdown-label">FALTAM</span>
      <div className="countdown-units">
        {units.map(([label, value], i) => (
          <Fragment key={label}>
            {i > 0 && <span className="cd-sep">:</span>}
            <div className="cd-unit">
              <span className="cd-num">{value}</span>
              <span className="cd-txt">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>
      <p className="countdown-live">
        {state === 'over' ? 'CAMPEONATO ENCERRADO — OBRIGADO, TORCIDA!' : 'O CAMPEONATO ESTÁ ROLANDO! 🏐'}
      </p>
    </div>
  );
}
