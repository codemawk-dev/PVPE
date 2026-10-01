import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './styles/style.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PVPE — Projeto de Vôlei Pedro Eduardo',
    template: '%s — PVPE',
  },
  description: 'Projeto de Vôlei Pedro Eduardo (PVPE) — Uruçuca - BA. Feminino e masculino. Treinador: Daniel Chaves.',
  icons: { icon: '/assets/img/logo-pvpe.png' },
};

export const viewport: Viewport = {
  themeColor: '#080315',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
