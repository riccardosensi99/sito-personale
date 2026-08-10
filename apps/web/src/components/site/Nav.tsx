export function Nav() {
  return (
    <nav className="nav">
      <a className="brand" href="#top">
        <span className="brand-mark">RS</span>
        <span>Riccardo Sensi</span>
      </a>
      <div className="nav-links">
        <a href="#projects">Progetti</a>
        <a href="#services">Servizi</a>
        <a href="#about">Esperienza</a>
        <a href="#contact">Contatti</a>
      </div>
      <a className="nav-cta" href="#contact">
        Parliamone
      </a>
    </nav>
  );
}
