import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/AdminApp';
import '../styles/admin.css';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
