export type Page = 'home' | 'combat' | 'combatActions' | 'scatter'

export const pageHashes: Record<Page, string> = {
  home: '#/',
  combat: '#/shoot',
  combatActions: '#/combat-actions',
  scatter: '#/scatter',
}

export const pageLabels: Record<Page, string> = {
  home: 'Start',
  combat: 'Shoot',
  combatActions: 'Combat Actions',
  scatter: 'Scatter',
}

export const getPageFromHash = (): Page => {
  if (window.location.hash === pageHashes.combat) {
    return 'combat'
  }

  if (window.location.hash === pageHashes.combatActions) {
    return 'combatActions'
  }

  if (window.location.hash === pageHashes.scatter) {
    return 'scatter'
  }

  return 'home'
}
