import { useEffect, useState } from 'react'
import './App.css'
import TopNav from './components/TopNav'
import { getPageFromHash, pageHashes, type Page } from './navigation'
import CombatAssistantPage from './pages/CombatAssistantPage'
import HomePage from './pages/HomePage'

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (nextPage: Page) => {
    window.location.hash = pageHashes[nextPage]
  }

  return (
    <>
      <TopNav currentPage={page} onNavigate={navigateTo} />
      {page === 'home' ? (
        <HomePage onNavigate={navigateTo} />
      ) : (
        <CombatAssistantPage onBack={() => navigateTo('home')} />
      )}
    </>
  )
}

export default App
