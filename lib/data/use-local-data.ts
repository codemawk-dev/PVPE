'use client';

// No MODO LOCAL, as edições do painel ficam no navegador: depois de carregar,
// a página troca os dados vindos do servidor pelos salvos aqui.
// Com Supabase, o servidor já entrega os dados atualizados e nada muda.
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../config';
import { getDb } from './client';
import type { DataAdapter } from './adapter';

export function useLocalData<T>(initial: T, load: (db: DataAdapter) => Promise<T>): { data: T; ready: boolean } {
  const [state, setState] = useState({ data: initial, ready: isSupabaseConfigured });

  useEffect(() => {
    if (isSupabaseConfigured) return;
    let alive = true;
    getDb()
      .then(load)
      .then((data) => { if (alive) setState({ data, ready: true }); })
      .catch((err) => {
        console.warn('[PVPE] usando dados do servidor:', err);
        if (alive) setState((s) => ({ ...s, ready: true }));
      });
    return () => { alive = false; };
    // carregar só uma vez, ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
