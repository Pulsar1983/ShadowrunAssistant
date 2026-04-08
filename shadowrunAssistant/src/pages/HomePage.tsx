import type { Page } from '../navigation'

type HomePageProps = {
  onNavigate: (page: Page) => void
}

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <main className="page page-home">
      <section className="hero-panel">
        <p className="eyebrow">Shadowrun Assistant</p>        
        <p className="intro">
          Klick auf die Kachel unten und du landest auf einer zweiten Seite
          innerhalb deiner App.
        </p>
      </section>

      <section className="tile-grid" aria-label="Navigation">
        <button className="nav-tile" onClick={() => onNavigate('combat')}>
          <span className="tile-label">Shoot</span>
          <strong>Zur Shoot-Seite</strong>
          <span className="tile-copy">
            Ideal als Start-Kachel fuer weitere Bereiche wie Charaktere,
            Inventar oder Missionen.
          </span>
        </button>
        <button className="nav-tile" onClick={() => onNavigate('combatActions')}>
          <span className="tile-label">Combat Actions</span>
          <strong>SR4 Actions</strong>
          <span className="tile-copy">
            Schnellreferenz fuer Free, Simple und Complex Actions aus SR4.
          </span>
        </button>
        <button className="nav-tile" onClick={() => onNavigate('scatter')}>
          <span className="tile-label">Scatter</span>
          <strong>Granaten und Raketen</strong>
          <span className="tile-copy">
            Scatter-Diagramm, Typ-Auswahl und Roll-Button fuer Richtung und
            Abweichung.
          </span>
        </button>
      </section>
    </main>
  )
}

export default HomePage
