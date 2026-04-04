import { useEffect, useState } from 'react'

type CombatAssistantPageProps = {
  onBack: () => void
}

type ModifierCombatDto = {
  id: string
  label: string
  category: string
  diceModifier: number
}

type RangeModifierDto = {
  weaponType: string
  shortMax: number
  mediumMax: number
  longMax: number
  extremeMax: number
}

type VisibilityModifierDto = {
  sight: string
  visibility: string
  diceModifier: number
}

type WoundModifierResponse = {
  totalModifier: number
}

const categoryOrder = [
  'MOVEMENT',
  'COVER',
  'MISC',
  'VISIBILITY',
  'SIGHT',
  'AIM_AID',
] as const

type SelectedModifierValue = string | string[]
type SelectedModifiersByCategory = Record<string, SelectedModifierValue>
type CalculateResponse = Record<string, unknown>
type PanelStates = Record<string, boolean>

const storageKeys = {
  attribute: 'combat.attribute',
  skill: 'combat.skill',
  recoilPenalty: 'combat.recoilPenalty',
  physicalWounds: 'combat.physicalWounds',
  mentalWounds: 'combat.mentalWounds',
  highPainTolerance: 'combat.highPainTolerance',
  weaponType: 'combat.weaponType',
  distanceMeters: 'combat.distanceMeters',
  modifiers: 'combat.modifiersByCategory',
  panels: 'combat.panelStates',
} as const

const clampSliderValue = (value: number) => Math.min(12, Math.max(0, value))
const clampWoundsValue = (value: number) => Math.min(15, Math.max(0, value))
const clampHighPainToleranceValue = (value: number) =>
  Math.min(10, Math.max(0, value))
const clampDistanceValue = (value: number) => Math.min(1000, Math.max(0, value))

const readStoredNumber = (
  key: string,
  fallbackValue: number,
  clamp?: (value: number) => number,
) => {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const storedValue = window.localStorage.getItem(key)

  if (storedValue === null) {
    return fallbackValue
  }

  const parsedValue = Number(storedValue)

  if (Number.isNaN(parsedValue)) {
    return fallbackValue
  }

  return clamp ? clamp(parsedValue) : parsedValue
}

const readStoredModifiers = (): SelectedModifiersByCategory => {
  if (typeof window === 'undefined') {
    return {}
  }

  const storedValue = window.localStorage.getItem(storageKeys.modifiers)

  if (!storedValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object') {
      return {}
    }

    return Object.entries(parsedValue).reduce<SelectedModifiersByCategory>(
      (result, [category, modifierId]) => {
        if (
          typeof modifierId === 'string' ||
          (Array.isArray(modifierId) &&
            modifierId.every((entry) => typeof entry === 'string'))
        ) {
          result[category] = modifierId
        }

        return result
      },
      {},
    )
  } catch {
    return {}
  }
}

const readStoredString = (key: string, fallbackValue = '') => {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  return window.localStorage.getItem(key) ?? fallbackValue
}

const readStoredPanelStates = (): PanelStates => {
  if (typeof window === 'undefined') {
    return {}
  }

  const storedValue = window.localStorage.getItem(storageKeys.panels)

  if (!storedValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object') {
      return {}
    }

    return Object.entries(parsedValue).reduce<PanelStates>((result, [key, value]) => {
      if (typeof value === 'boolean') {
        result[key] = value
      }

      return result
    }, {})
  } catch {
    return {}
  }
}

const formatModifierLabel = (modifier: ModifierCombatDto) =>
  modifier.diceModifier === 0
    ? modifier.label
    : `${modifier.label} (${modifier.diceModifier >= 0 ? '+' : ''}${modifier.diceModifier})`

type StepperFieldProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  showLabel?: boolean
}

function StepperField({
  label,
  value,
  min,
  max,
  onChange,
  showLabel = true,
}: StepperFieldProps) {
  return (
    <div className="stepper-field">
      {showLabel ? (
        <div className="stepper-header">
          <span className="stepper-label">{label}</span>
        </div>
      ) : null}
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} verringern`}
        >
          -
        </button>
        <div className="stepper-display" aria-live="polite">
          {value}
        </div>
        <button
          type="button"
          className="stepper-button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${label} erhoehen`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function CombatAssistantPage({ onBack }: CombatAssistantPageProps) {
  const [attributeValue, setAttributeValue] = useState(() =>
    readStoredNumber(storageKeys.attribute, 0, clampSliderValue),
  )
  const [skillValue, setSkillValue] = useState(() =>
    readStoredNumber(storageKeys.skill, 0, clampSliderValue),
  )
  const [recoilPenaltyValue, setRecoilPenaltyValue] = useState(() =>
    readStoredNumber(storageKeys.recoilPenalty, 0, clampSliderValue),
  )
  const [physicalWoundsValue, setPhysicalWoundsValue] = useState(() =>
    readStoredNumber(storageKeys.physicalWounds, 0, clampWoundsValue),
  )
  const [mentalWoundsValue, setMentalWoundsValue] = useState(() =>
    readStoredNumber(storageKeys.mentalWounds, 0, clampWoundsValue),
  )
  const [highPainToleranceValue, setHighPainToleranceValue] = useState(() =>
    readStoredNumber(
      storageKeys.highPainTolerance,
      0,
      clampHighPainToleranceValue,
    ),
  )
  const [weaponType, setWeaponType] = useState(() =>
    readStoredString(storageKeys.weaponType, ''),
  )
  const [distanceMeters, setDistanceMeters] = useState(() =>
    readStoredNumber(storageKeys.distanceMeters, 0, clampDistanceValue),
  )
  const [weaponTypes, setWeaponTypes] = useState<string[]>([])
  const [modifierOptions, setModifierOptions] = useState<ModifierCombatDto[]>([])
  const [rangeOptions, setRangeOptions] = useState<RangeModifierDto[]>([])
  const [visibilityOptions, setVisibilityOptions] = useState<VisibilityModifierDto[]>(
    [],
  )
  const [selectedModifiersByCategory, setSelectedModifiersByCategory] =
    useState<SelectedModifiersByCategory>(() => readStoredModifiers())
  const [panelStates, setPanelStates] = useState<PanelStates>(() =>
    readStoredPanelStates(),
  )
  const [isLoadingModifiers, setIsLoadingModifiers] = useState(true)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiResponse, setApiResponse] = useState<CalculateResponse | string | null>(
    null,
  )
  const [apiError, setApiError] = useState<string | null>(null)
  const [modifierError, setModifierError] = useState<string | null>(null)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [woundModifier, setWoundModifier] = useState<number | null>(null)
  const [woundModifierError, setWoundModifierError] = useState<string | null>(null)

  useEffect(() => {
    const loadModifiers = async () => {
      setIsLoadingModifiers(true)
      setModifierError(null)

      try {
        const response = await fetch('/api/modifier-combat/modifiers')
        const responseText = await response.text()

        if (!response.ok) {
          throw new Error(
            responseText || `Request failed with status ${response.status}`,
          )
        }

        const parsedResponse = JSON.parse(responseText) as ModifierCombatDto[]
        const sortedResponse = [...parsedResponse].sort((left, right) =>
          left.label.localeCompare(right.label),
        )
        setModifierOptions(sortedResponse)
      } catch (error) {
        setModifierError(
          error instanceof Error ? error.message : 'Unknown request error',
        )
      } finally {
        setIsLoadingModifiers(false)
      }
    }

    void loadModifiers()
  }, [])

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true)
      setMetadataError(null)

      try {
        const [weaponTypesResponse, rangeResponse, visibilityResponse] = await Promise.all([
          fetch('/api/modifier-combat/weapon-types'),
          fetch('/api/modifier-combat/range-modifiers'),
          fetch('/api/modifier-combat/visibility-modifiers'),
        ])

        const [weaponTypesText, rangeText, visibilityText] = await Promise.all([
          weaponTypesResponse.text(),
          rangeResponse.text(),
          visibilityResponse.text(),
        ])

        if (!weaponTypesResponse.ok) {
          throw new Error(
            weaponTypesText ||
              `Weapon types request failed with status ${weaponTypesResponse.status}`,
          )
        }

        if (!rangeResponse.ok) {
          throw new Error(
            rangeText || `Range request failed with status ${rangeResponse.status}`,
          )
        }

        if (!visibilityResponse.ok) {
          throw new Error(
            visibilityText ||
              `Visibility request failed with status ${visibilityResponse.status}`,
          )
        }

        setWeaponTypes(JSON.parse(weaponTypesText) as string[])
        setRangeOptions(JSON.parse(rangeText) as RangeModifierDto[])
        setVisibilityOptions(JSON.parse(visibilityText) as VisibilityModifierDto[])
      } catch (error) {
        setMetadataError(
          error instanceof Error ? error.message : 'Unknown metadata error',
        )
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    void loadMetadata()
  }, [])

  useEffect(() => {
    if (modifierOptions.length === 0) {
      return
    }

    const modifiersByCategory = modifierOptions.reduce<
      Record<string, ModifierCombatDto[]>
    >((result, modifier) => {
      const categoryEntries = result[modifier.category] ?? []
      categoryEntries.push(modifier)
      result[modifier.category] = categoryEntries
      return result
    }, {})

    setSelectedModifiersByCategory((currentValue) => {
      const nextValue = Object.entries(currentValue).reduce<SelectedModifiersByCategory>(
        (result, [category, selectedValue]) => {
          const validEntries = modifiersByCategory[category]

          if (!validEntries) {
            return result
          }

          const validIds = new Set(validEntries.map((entry) => entry.id))

          if (Array.isArray(selectedValue)) {
            const filteredValues = selectedValue.filter((entry) =>
              validIds.has(entry),
            )

            if (filteredValues.length > 0) {
              result[category] = filteredValues
            }

            return result
          }

          if (validIds.has(selectedValue)) {
            result[category] = selectedValue
          }

          return result
        },
        {},
      )

      Object.entries(modifiersByCategory).forEach(([category, categoryModifiers]) => {
        if (category === 'MISC' || nextValue[category]) {
          return
        }

        const defaultModifier =
          categoryModifiers.find((modifier) => modifier.diceModifier === 0) ??
          categoryModifiers[0]

        if (defaultModifier) {
          nextValue[category] = defaultModifier.id
        }
      })

      return JSON.stringify(nextValue) === JSON.stringify(currentValue)
        ? currentValue
        : nextValue
    })
  }, [modifierOptions])

  useEffect(() => {
    if (weaponTypes.length === 0) {
      return
    }

    if (!weaponType || !weaponTypes.includes(weaponType)) {
      setWeaponType(weaponTypes[0] ?? '')
    }
  }, [weaponType, weaponTypes])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.attribute,
      String(clampSliderValue(attributeValue)),
    )
  }, [attributeValue])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.skill,
      String(clampSliderValue(skillValue)),
    )
  }, [skillValue])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.recoilPenalty,
      String(clampSliderValue(recoilPenaltyValue)),
    )
  }, [recoilPenaltyValue])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.physicalWounds,
      String(clampWoundsValue(physicalWoundsValue)),
    )
  }, [physicalWoundsValue])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.mentalWounds,
      String(clampWoundsValue(mentalWoundsValue)),
    )
  }, [mentalWoundsValue])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.highPainTolerance,
      String(clampHighPainToleranceValue(highPainToleranceValue)),
    )
  }, [highPainToleranceValue])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.weaponType, weaponType)
  }, [weaponType])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.distanceMeters,
      String(clampDistanceValue(distanceMeters)),
    )
  }, [distanceMeters])

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.modifiers,
      JSON.stringify(selectedModifiersByCategory),
    )
  }, [selectedModifiersByCategory])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.panels, JSON.stringify(panelStates))
  }, [panelStates])

  const handleModifierSelect = (category: string, modifierId: string) => {
    setSelectedModifiersByCategory((currentValue) => {
      if (modifierId === '') {
        const nextValue = { ...currentValue }
        delete nextValue[category]
        return nextValue
      }

      return {
        ...currentValue,
        [category]: modifierId,
      }
    })
  }

  const handleMiscModifierToggle = (modifierId: string) => {
    setSelectedModifiersByCategory((currentValue) => {
      const currentSelection = currentValue.MISC
      const miscSelection = Array.isArray(currentSelection)
        ? currentSelection
        : []

      if (miscSelection.includes(modifierId)) {
        const nextSelection = miscSelection.filter((entry) => entry !== modifierId)

        if (nextSelection.length === 0) {
          const nextValue = { ...currentValue }
          delete nextValue.MISC
          return nextValue
        }

        return {
          ...currentValue,
          MISC: nextSelection,
        }
      }

      return {
        ...currentValue,
        MISC: [...miscSelection, modifierId],
      }
    })
  }

  const isPanelOpen = (panelKey: string, defaultValue = true) =>
    panelStates[panelKey] ?? defaultValue

  const handlePanelToggle = (panelKey: string, isOpen: boolean) => {
    setPanelStates((currentValue) => ({
      ...currentValue,
      [panelKey]: isOpen,
    }))
  }

  const selectedModifierIds = Object.values(selectedModifiersByCategory).flatMap(
    (value) => (Array.isArray(value) ? value : [value]),
  )
  const selectedModifierIdsKey = JSON.stringify(selectedModifierIds)

  const handleCombatRequest = async (signal?: AbortSignal) => {
    const payload = {
      attribute: attributeValue,
      skill: skillValue,
      recoilPenalty: recoilPenaltyValue,
      physicalWounds: physicalWoundsValue,
      mentalWounds: mentalWoundsValue,
      highPainTolerance: highPainToleranceValue,
      weaponType,
      distanceMeters,
      modifiers: selectedModifierIds,
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      const response = await fetch(
        '/api/modifier-combat/calculate',
        {
          signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const responseText = await response.text()
      const contentType = response.headers.get('content-type') ?? ''

      if (!response.ok) {
        throw new Error(
          responseText || `Request failed with status ${response.status}`,
        )
      }

      if (!responseText) {
        setApiResponse('Request successful, no body returned.')
        return
      }

      if (contentType.includes('application/json')) {
        setApiResponse(JSON.parse(responseText) as CalculateResponse)
        return
      }

      setApiResponse(responseText)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setApiError(
        error instanceof Error ? error.message : 'Unknown request error',
      )
    } finally {
      if (!signal?.aborted) {
        setIsSubmitting(false)
      }
    }
  }

  const groupedModifiers = modifierOptions.reduce<
    Record<string, ModifierCombatDto[]>
  >((groups, modifier) => {
    const categoryGroup = groups[modifier.category] ?? []
    categoryGroup.push(modifier)
    groups[modifier.category] = categoryGroup
    return groups
  }, {})

  const sortedCategories = Object.keys(groupedModifiers).sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left as (typeof categoryOrder)[number])
    const rightIndex = categoryOrder.indexOf(right as (typeof categoryOrder)[number])

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right)
    }

    if (leftIndex === -1) {
      return 1
    }

    if (rightIndex === -1) {
      return -1
    }

    return leftIndex - rightIndex
  })
  const selectedSight =
    typeof selectedModifiersByCategory.SIGHT === 'string'
      ? selectedModifiersByCategory.SIGHT
      : ''
  const selectedVisibility =
    typeof selectedModifiersByCategory.VISIBILITY === 'string'
      ? selectedModifiersByCategory.VISIBILITY
      : ''
  const selectedRangeProfile =
    rangeOptions.find((entry) => entry.weaponType === weaponType) ?? null
  const currentRangeBand = selectedRangeProfile
    ? distanceMeters <= selectedRangeProfile.shortMax
      ? 'SHORT'
      : distanceMeters <= selectedRangeProfile.mediumMax
        ? 'MEDIUM'
        : distanceMeters <= selectedRangeProfile.longMax
          ? 'LONG'
          : distanceMeters <= selectedRangeProfile.extremeMax
            ? 'EXTREME'
            : 'OUT_OF_RANGE'
    : null
  const currentVisibilityModifier =
    visibilityOptions.find(
      (entry) =>
        entry.sight === selectedSight && entry.visibility === selectedVisibility,
    ) ?? null
  const formattedApiResponse =
    typeof apiResponse === 'string'
      ? apiResponse
      : apiResponse
        ? JSON.stringify(apiResponse, null, 2)
        : null
  const formattedRequestPreview = JSON.stringify(
    {
      attribute: attributeValue,
      skill: skillValue,
      recoilPenalty: recoilPenaltyValue,
      physicalWounds: physicalWoundsValue,
      mentalWounds: mentalWoundsValue,
      highPainTolerance: highPainToleranceValue,
      weaponType,
      distanceMeters,
      modifiers: selectedModifierIds,
    },
    null,
    2,
  )
  const dicePoolValue =
    apiResponse && typeof apiResponse !== 'string'
      ? apiResponse.dicePool
      : null

  const handleReset = () => {
    window.localStorage.removeItem(storageKeys.attribute)
    window.localStorage.removeItem(storageKeys.skill)
    window.localStorage.removeItem(storageKeys.recoilPenalty)
    window.localStorage.removeItem(storageKeys.physicalWounds)
    window.localStorage.removeItem(storageKeys.mentalWounds)
    window.localStorage.removeItem(storageKeys.highPainTolerance)
    window.localStorage.removeItem(storageKeys.weaponType)
    window.localStorage.removeItem(storageKeys.distanceMeters)
    window.localStorage.removeItem(storageKeys.modifiers)
    window.localStorage.removeItem(storageKeys.panels)

    setAttributeValue(0)
    setSkillValue(0)
    setRecoilPenaltyValue(0)
    setPhysicalWoundsValue(0)
    setMentalWoundsValue(0)
    setHighPainToleranceValue(0)
    setWeaponType('')
    setDistanceMeters(0)
    setSelectedModifiersByCategory({})
    setPanelStates({})
    setApiResponse(null)
    setApiError(null)
    setWoundModifier(null)
    setWoundModifierError(null)
  }

  useEffect(() => {
    const abortController = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setWoundModifierError(null)

        const response = await fetch('/api/modifier-combat/wound-modifier', {
          signal: abortController.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            physicalWounds: physicalWoundsValue,
            mentalWounds: mentalWoundsValue,
            highPainTolerance: highPainToleranceValue,
          }),
        })

        const responseText = await response.text()

        if (!response.ok) {
          throw new Error(
            responseText || `Wound request failed with status ${response.status}`,
          )
        }

        const parsedResponse = JSON.parse(responseText) as WoundModifierResponse
        setWoundModifier(parsedResponse.totalModifier)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setWoundModifier(null)
        setWoundModifierError(
          error instanceof Error ? error.message : 'Unknown wound error',
        )
      }
    }, 150)

    return () => {
      window.clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [physicalWoundsValue, mentalWoundsValue, highPainToleranceValue])

  useEffect(() => {
    if (isLoadingModifiers || isLoadingMetadata || !weaponType) {
      setIsSubmitting(false)
      setApiError(null)
      return
    }

    const abortController = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(true)
      setApiError(null)
      void handleCombatRequest(abortController.signal)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [
    attributeValue,
    skillValue,
    recoilPenaltyValue,
    physicalWoundsValue,
    mentalWoundsValue,
    highPainToleranceValue,
    weaponType,
    distanceMeters,
    selectedModifierIdsKey,
    isLoadingModifiers,
    isLoadingMetadata,
  ])

  return (
    <main className="page page-detail">
      <section className="detail-card">
        <div className="page-toolbar">
          <p className="eyebrow">Combat Assistant</p>
          <button type="button" className="secondary-button" onClick={handleReset}>
            Reset
          </button>
        </div>
        {typeof dicePoolValue === 'number' ? (
          <div className="sticky-dicepool">
            <div className="combat-summary-card">
              <span className="combat-summary-label">Dice Pool</span>
              <strong className="combat-summary-value">{dicePoolValue}</strong>
            </div>
          </div>
        ) : null}        
        <div className="combat-form">
          <div className="wounds-card">
            <div className="wounds-card-header">
              <div>
                <p className="wounds-title">Wounds</p>                
              </div>
              <div className="wounds-total">
                <span className="wounds-total-label">Wound Mod</span>
                <strong className="wounds-total-value">
                  {woundModifier === null ? '-' : woundModifier}
                </strong>
              </div>
            </div>
            <div className="wounds-grid">
              <StepperField
                label="Physical"
                value={physicalWoundsValue}
                min={0}
                max={15}
                onChange={(value) =>
                  setPhysicalWoundsValue(clampWoundsValue(value))
                }
              />
              <StepperField
                label="Mental"
                value={mentalWoundsValue}
                min={0}
                max={15}
                onChange={(value) => setMentalWoundsValue(clampWoundsValue(value))}
              />
              <StepperField
                label="High Pain Tolerance"
                value={highPainToleranceValue}
                min={0}
                max={10}
                onChange={(value) =>
                  setHighPainToleranceValue(clampHighPainToleranceValue(value))
                }
              />
            </div>
            {woundModifierError ? (
              <p className="wounds-error">{woundModifierError}</p>
            ) : null}
          </div>
          <div className="combat-side-stack">
            <StepperField
              label="Recoil Penalty"
              value={recoilPenaltyValue}
              min={0}
              max={15}
              onChange={(value) =>
                setRecoilPenaltyValue(Math.min(15, Math.max(0, value)))
              }
            />
            <label className="slider-field">
              <div className="slider-header">
                <span className="slider-label">Distance Meters</span>
                <strong className="slider-value">{distanceMeters}</strong>
              </div>
              <input
                className="number-input"
                type="number"
                min={0}
                max={1000}
                step={1}
                value={distanceMeters}
                onChange={(event) =>
                  setDistanceMeters(clampDistanceValue(Number(event.target.value)))
                }
              />
            </label>
          </div>
        </div>
        {isLoadingMetadata ? <p>Lade Range- und Visibility-Daten...</p> : null}
        {metadataError ? <pre className="combat-result error">{metadataError}</pre> : null}
        <div className="modifier-section">
          <h3 className="modifier-title">Modifiers</h3>
          {isLoadingModifiers ? <p>Lade Modifier...</p> : null}
          {modifierError ? (
            <pre className="combat-result error">{modifierError}</pre>
          ) : null}
          {!isLoadingModifiers && !modifierError ? (
            <div className="modifier-groups">
              {sortedCategories.map((category) => (
                <details
                  key={category}
                  className="modifier-category"
                  open={isPanelOpen(`modifier:${category}`)}
                  onToggle={(event) =>
                    handlePanelToggle(
                      `modifier:${category}`,
                      event.currentTarget.open,
                    )
                  }
                >
                  <summary className="modifier-category-summary">
                    <span className="modifier-category-title">{category}</span>
                  </summary>
                  <div className="modifier-category-body">
                    <div className="modifier-grid">
                      {category === 'MISC' ? (
                        groupedModifiers[category].map((modifier) => (
                          <label key={modifier.id} className="modifier-option">
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(selectedModifiersByCategory.MISC) &&
                                selectedModifiersByCategory.MISC.includes(modifier.id)
                              }
                              onChange={() => handleMiscModifierToggle(modifier.id)}
                            />
                            <span>{formatModifierLabel(modifier)}</span>
                          </label>
                        ))
                      ) : (
                        <>
                          {groupedModifiers[category].map((modifier) => (
                            <label key={modifier.id} className="modifier-option">
                              <input
                                type="radio"
                                name={category}
                                checked={
                                  selectedModifiersByCategory[category] === modifier.id
                                }
                                onChange={() =>
                                  handleModifierSelect(category, modifier.id)
                                }
                              />
                              <span>{formatModifierLabel(modifier)}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
        <div className="combat-form combat-form-secondary">
          <details
            className="control-panel"
            open={isPanelOpen('attribute')}
            onToggle={(event) =>
              handlePanelToggle('attribute', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">Attribute</span>
            </summary>
            <div className="control-panel-body">
              <StepperField
                label="Attribute"
                value={attributeValue}
                min={0}
                max={15}
                showLabel={false}
                onChange={(value) =>
                  setAttributeValue(Math.min(15, Math.max(0, value)))
                }
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('skill')}
            onToggle={(event) => handlePanelToggle('skill', event.currentTarget.open)}
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">Skill</span>
            </summary>
            <div className="control-panel-body">
              <StepperField
                label="Skill"
                value={skillValue}
                min={0}
                max={15}
                showLabel={false}
                onChange={(value) =>
                  setSkillValue(Math.min(15, Math.max(0, value)))
                }
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('weaponType')}
            onToggle={(event) =>
              handlePanelToggle('weaponType', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">Weapon Type</span>
            </summary>
            <div className="control-panel-body">
              <label className="slider-field">
                <div className="slider-header">
                  <strong className="slider-value slider-value-text">
                    {weaponType || '-'}
                  </strong>
                </div>
                <select
                  className="select-input"
                  value={weaponType}
                  onChange={(event) => setWeaponType(event.target.value)}
                >
                  <option value="">Bitte waehlen</option>
                  {weaponTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </div>
        {!isLoadingMetadata && !metadataError ? (
          <div className="combat-hints">
            <div className="combat-hint-card">
              <p className="response-label">Reichweite</p>
              <p>
                Band: <strong>{currentRangeBand ?? '-'}</strong>
              </p>
              {selectedRangeProfile ? (
                <p className="hint-copy">
                  Short {selectedRangeProfile.shortMax}m, Medium{' '}
                  {selectedRangeProfile.mediumMax}m, Long{' '}
                  {selectedRangeProfile.longMax}m, Extreme{' '}
                  {selectedRangeProfile.extremeMax}m
                </p>
              ) : (
                <p className="hint-copy">Bitte einen Weapon Type auswaehlen.</p>
              )}
            </div>
            <div className="combat-hint-card">
              <p className="response-label">Sicht / Visibility</p>
              <p>
                Kombinations-Malus:{' '}
                <strong>
                  {currentVisibilityModifier
                    ? currentVisibilityModifier.diceModifier
                    : '-'}
                </strong>
              </p>
              <p className="hint-copy">
                Wird aus der Kombination von `SIGHT` und `VISIBILITY`
                abgeleitet.
              </p>
            </div>
          </div>
        ) : null}
        <details
          className="combat-preview"
          open={isPanelOpen('debug', false)}
          onToggle={(event) => handlePanelToggle('debug', event.currentTarget.open)}
        >
          <summary className="combat-preview-summary">Debug</summary>
          <div className="debug-panel">
            <div className="debug-section">
              <p className="response-label">REST-Input spaeter</p>
              <pre className="combat-preview-body">{formattedRequestPreview}</pre>
            </div>
            {apiResponse ? (
              <div className="debug-section">
                <p className="response-label">Antwort vom Backend</p>
                <pre className="combat-result success">{formattedApiResponse}</pre>
              </div>
            ) : null}
            {apiError ? (
              <div className="debug-section">
                <p className="response-label">Fehler beim Request</p>
                <pre className="combat-result error">{apiError}</pre>
              </div>
            ) : null}
          </div>
        </details>
        <p className="auto-calculate-hint">
          {isSubmitting
            ? 'Berechnung wird aktualisiert...'
            : 'Ergebnis aktualisiert sich automatisch bei jeder Aenderung.'}
        </p>
        <button className="back-button" onClick={onBack}>
          Zurueck zur Startseite
        </button>
      </section>
    </main>
  )
}

export default CombatAssistantPage
