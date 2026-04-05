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
          <span className="tile-label">Combat Assistant</span>
          <strong>Zur Combat-Seite</strong>
          <span className="tile-copy">
            Ideal als Start-Kachel fuer weitere Bereiche wie Charaktere,
            Inventar oder Missionen.
          </span>
        </button>
      </section>
    </main>
  )
}

export default HomePage
