export type Page = 'home' | 'combat'

export const pageHashes: Record<Page, string> = {
  home: '#/',
  combat: '#/combat-assistant',
}

export const pageLabels: Record<Page, string> = {
  home: 'Start',
  combat: 'Combat Assistant',
}

export const getPageFromHash = (): Page =>
  window.location.hash === pageHashes.combat ? 'combat' : 'home'
