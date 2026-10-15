export default function Home() {
  return (
    <main className="landing">
      <nav className="nav" aria-label="Navegación principal">
        <a className="brand" href="#inicio" aria-label="Inicio">
          <span className="brand-mark">U</span>
          <span>Tu espacio</span>
        </a>
        <a className="nav-link" href="#contacto">Hablemos <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Una idea, un gran comienzo</p>
          <h1>Las buenas ideas<br />merecen <span>verse.</span></h1>
          <p className="intro">
            Un espacio para presentar lo que haces, compartir tu visión y dar el siguiente paso.
          </p>
          <a className="button" href="mailto:hola@tuespacio.com">
            Cuéntame tu idea <span aria-hidden="true">↗</span>
          </a>
          <p className="note">Simple, claro y hecho para empezar.</p>
        </div>

        <div className="hero-art" aria-label="Ilustración abstracta en tonos cálidos" role="img">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sun" />
          <div className="art-card">
            <span className="card-spark">✳</span>
            <span>Empieza<br />por aquí</span>
            <span className="card-arrow">↗</span>
          </div>
          <span className="art-caption">IDEAS EN MOVIMIENTO · 2026</span>
        </div>
      </section>

      <footer id="contacto">
        <span>Un buen comienzo lo cambia todo.</span>
        <a href="mailto:hola@tuespacio.com">hola@tuespacio.com</a>
      </footer>
    </main>
  );
}
