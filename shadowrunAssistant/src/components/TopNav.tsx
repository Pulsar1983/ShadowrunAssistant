import type { Page } from '../navigation'
import { pageLabels } from '../navigation'

type TopNavProps = {
  currentPage: Page
  onNavigate: (page: Page) => void
}

function TopNav({ currentPage, onNavigate }: TopNavProps) {
  return (
    <nav className="top-nav" aria-label="Seitennavigation">
      <button
        className={currentPage === 'home' ? 'nav-link active' : 'nav-link'}
        onClick={() => onNavigate('home')}
      >
        {pageLabels.home}
      </button>
      <button
        className={currentPage === 'combat' ? 'nav-link active' : 'nav-link'}
        onClick={() => onNavigate('combat')}
      >
        {pageLabels.combat}
      </button>
    </nav>
  )
}

export default TopNav
