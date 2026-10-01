import Link from 'next/link';

export const metadata = { title: 'Página não encontrada', robots: { index: false } };

export default function NotFound() {
  return (
    <main className="nf">
      <img src="/assets/img/logo-pvpe.png" alt="PVPE" />
      <strong>404</strong>
      <h1>Essa página saiu da quadra</h1>
      <p>O endereço que você tentou abrir não existe ou foi removido.</p>
      <Link href="/" className="btn btn-yellow">VOLTAR PARA O INÍCIO</Link>
    </main>
  );
}
