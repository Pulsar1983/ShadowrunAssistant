import { useMemo, useState } from 'react'

type ScatterPageProps = {
  onBack: () => void
}

type ScatterWeaponType = {
  id: string
  label: string
  diceCount: number
  hitMultiplier: number
}

type ScatterResult = {
  directionRoll: number
  distanceRolls: number[]
  distanceTotal: number
  hits: number
  sensor: number
  scatterDistance: number
  directionLabel: string
}

const scatterWeaponTypes: ScatterWeaponType[] = [
  {
    id: 'standard-grenade',
    label: 'Standard Grenade',
    diceCount: 1,
    hitMultiplier: 2,
  },
  {
    id: 'aerodynamic-grenade',
    label: 'Aerodynamic Grenade',
    diceCount: 2,
    hitMultiplier: 4,
  },
  {
    id: 'grenade-launcher',
    label: 'Grenade Launcher',
    diceCount: 3,
    hitMultiplier: 4,
  },
  {
    id: 'rocket',
    label: 'Rocket',
    diceCount: 2,
    hitMultiplier: 1,
  },
  {
    id: 'missile',
    label: 'Missile',
    diceCount: 2,
    hitMultiplier: 1,
  },
]

const scatterDirectionMap: Record<number, string> = {
  1: 'Up',
  2: 'Up Right',
  3: 'Right',
  4: 'Down Right',
  5: 'Down',
  6: 'Down Left',
  7: 'Left',
  8: 'Up Left',
}

const rollDie = () => Math.floor(Math.random() * 6) + 1
const rollDirection = () => Math.floor(Math.random() * 8) + 1

function ScatterPage({ onBack }: ScatterPageProps) {
  const [weaponTypeId, setWeaponTypeId] = useState(scatterWeaponTypes[0]?.id ?? '')
  const [hits, setHits] = useState(0)
  const [sensor, setSensor] = useState(0)
  const [result, setResult] = useState<ScatterResult | null>(null)

  const selectedWeaponType = useMemo(
    () =>
      scatterWeaponTypes.find((weaponType) => weaponType.id === weaponTypeId) ??
      scatterWeaponTypes[0],
    [weaponTypeId],
  )
  const isMissile = selectedWeaponType.id === 'missile'

  const handleRoll = () => {
    const directionRoll = rollDirection()
    const distanceRolls = Array.from(
      { length: selectedWeaponType.diceCount },
      () => rollDie(),
    )
    const distanceTotal = distanceRolls.reduce((sum, value) => sum + value, 0)
    const scatterDistance = Math.max(
      0,
      distanceTotal -
        hits * selectedWeaponType.hitMultiplier -
        (isMissile ? sensor : 0),
    )

    setResult({
      directionRoll,
      distanceRolls,
      distanceTotal,
      hits,
      sensor,
      scatterDistance,
      directionLabel: scatterDirectionMap[directionRoll] ?? 'Unknown',
    })
  }

  return (
    <main className="page page-detail">
      <section className="detail-card">
        <div className="page-toolbar">
          <p className="eyebrow">Scatter</p>
        </div>
        <p className="intro">
          Scatter-Referenz fuer Granaten und Raketen mit Richtungsdiagramm,
          Erfolgen und Wurfbutton.
        </p>

        <div className="scatter-layout">
          <section className="scatter-card">
            <h2 className="action-group-title">Roll</h2>
            <fieldset className="scatter-radio-group">
              <legend className="scatter-legend">Typ</legend>
              {scatterWeaponTypes.map((weaponType) => (
                <label key={weaponType.id} className="scatter-radio-option">
                  <input
                    type="radio"
                    name="scatter-weapon-type"
                    value={weaponType.id}
                    checked={weaponType.id === weaponTypeId}
                    onChange={() => {
                      setWeaponTypeId(weaponType.id)
                      if (weaponType.id !== 'missile') {
                        setSensor(0)
                      }
                    }}
                  />
                  <span>
                    {weaponType.id === 'missile'
                      ? `${weaponType.label} (${weaponType.diceCount}W6 - ${weaponType.hitMultiplier}*Hits - Sensor)`
                      : `${weaponType.label} (${weaponType.diceCount}W6 - ${weaponType.hitMultiplier}*Hits)`}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="stepper-field">
              <div className="stepper-header">
                <span className="stepper-label">Erfolge</span>
              </div>
              <div className="stepper-controls">
                <button
                  type="button"
                  className="stepper-button"
                  onClick={() => setHits((currentValue) => Math.max(0, currentValue - 1))}
                  disabled={hits <= 0}
                  aria-label="Erfolge verringern"
                >
                  -
                </button>
                <div className="stepper-display" aria-live="polite">
                  {hits}
                </div>
                <button
                  type="button"
                  className="stepper-button"
                  onClick={() => setHits((currentValue) => Math.min(20, currentValue + 1))}
                  disabled={hits >= 20}
                  aria-label="Erfolge erhoehen"
                >
                  +
                </button>
              </div>
            </div>
            {isMissile ? (
              <div className="stepper-field">
                <div className="stepper-header">
                  <span className="stepper-label">Sensor</span>
                </div>
                <div className="stepper-controls">
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() =>
                      setSensor((currentValue) => Math.max(0, currentValue - 1))
                    }
                    disabled={sensor <= 0}
                    aria-label="Sensor verringern"
                  >
                    -
                  </button>
                  <div className="stepper-display" aria-live="polite">
                    {sensor}
                  </div>
                  <button
                    type="button"
                    className="stepper-button"
                    onClick={() =>
                      setSensor((currentValue) => Math.min(6, currentValue + 1))
                    }
                    disabled={sensor >= 6}
                    aria-label="Sensor erhoehen"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : null}

            <button type="button" className="action-button" onClick={handleRoll}>
              Roll
            </button>
          </section>
        </div>

        {result ? (
          <section className="scatter-result-card">
            <h2 className="action-group-title">Ergebnis</h2>
            <div className="scatter-result-grid">
              <div className="scatter-result-item">
                <span className="response-label">Scatter</span>
                <strong>
                  {result.scatterDistance === 0
                    ? 'Kein Scatter'
                    : `${result.scatterDistance} m ${result.directionLabel}`}
                </strong>
              </div>
            </div>
          </section>
        ) : null}

        <button className="back-button" onClick={onBack}>
          Zurueck zur Startseite
        </button>
      </section>
    </main>
  )
}

export default ScatterPage
