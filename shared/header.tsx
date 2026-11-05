export function Header({ modern }: { modern: boolean }) {
  return (
    <header className="site-header">
      <a href="/" className="brand">
        <span className="brand-mark">N</span> CACHE LAB
      </a>
      <nav aria-label="モデル切替">
        <a className={!modern ? 'selected' : ''} href="http://localhost:3200">
          従来モデル
        </a>
        <a className={modern ? 'selected' : ''} href="http://localhost:3201">
          Cache Components
        </a>
      </nav>
      <span className="version">Next.js 16.4.5</span>
    </header>
  );
}
