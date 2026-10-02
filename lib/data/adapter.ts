// Interface comum dos dois modos de dados (local e Supabase), usada no navegador.
import type { Row, TableName } from '../types';

export type ListOptions = { orderBy?: string; ascending?: boolean };

export type AdminUser = { email?: string | null };

export interface DataAdapter {
  mode: 'local' | 'supabase';
  list<T extends TableName>(table: T, opts?: ListOptions): Promise<Row<T>[]>;
  findBy<T extends TableName>(table: T, column: keyof Row<T> & string, value: unknown): Promise<Row<T> | null>;
  create<T extends TableName>(table: T, data: Partial<Row<T>>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string, data: Partial<Row<T>>): Promise<Row<T>>;
  remove(table: TableName, id: string): Promise<void>;
  uploadImage(file: File, folder?: string): Promise<string>;
  /** só no modo local: volta aos dados iniciais */
  reset?(): Promise<void>;
  auth: {
    getUser(): Promise<AdminUser | null>;
    signIn(email: string, password: string): Promise<AdminUser>;
    signOut(): Promise<void>;
    /** token da sessão, enviado ao servidor para provar o login (null no modo local) */
    getAccessToken(): Promise<string | null>;
  };
}
