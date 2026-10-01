import { CODEMAWK_URL } from '@/lib/messages';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-copy">© 2026 PVPE — Projeto de Vôlei Pedro Eduardo · Uruçuca - BA</p>
      <a href={CODEMAWK_URL} target="_blank" rel="noopener" className="dev-tag">
        <span className="dev-dot" />
        Desenvolvido por <strong>code<b>MAWK</b></strong>
      </a>
    </footer>
  );
}
