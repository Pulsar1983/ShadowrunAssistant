type CombatActionsPageProps = {
  onBack: () => void
}

type ActionGroup = {
  title: string
  actions: string[]
}

const actionGroups: ActionGroup[] = [
  {
    title: 'Free Actions',
    actions: [
      'Call a Shot',
      'Drop Prone',
      'Run',
      'Speak / Text / Transmit Phrase',
    ],
  },
  {
    title: 'Simple Actions',
    actions: [
      'Change Gun Mode',
      'Eject Smartgun Clip',
      'Fire Semi-Auto / Single Shot / Burst Fire',
      'Insert Clip',
      'Ready Weapon',
      'Take Aim',
    ],
  },
  {
    title: 'Complex Actions',
    actions: [
      'Cast Spell',
      'Fire Full-Auto',
      'Melee Attack',
      'Reload Weapon',
      'Sprint',
      'Throw Weapon',
    ],
  },
]

function CombatActionsPage({ onBack }: CombatActionsPageProps) {
  return (
    <main className="page page-detail">
      <section className="detail-card">
        <div className="page-toolbar">
          <p className="eyebrow">Combat Actions</p>
        </div>
        <p className="intro">
          Schnellreferenz fuer SR4-Combat-Actions, gruppiert nach Action-Typ.
        </p>
        <div className="actions-grid">
          {actionGroups.map((group) => (
            <section key={group.title} className="action-group-card">
              <h2 className="action-group-title">{group.title}</h2>
              <ul className="action-list">
                {group.actions.map((action) => (
                  <li key={action} className="action-list-item">
                    {action}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button className="back-button" onClick={onBack}>
          Zurueck zur Startseite
        </button>
      </section>
    </main>
  )
}

export default CombatActionsPage
