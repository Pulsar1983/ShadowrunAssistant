import { useEffect, useState } from 'react'
import { getApiUrl } from '../config'

type CombatAssistantPageProps = {
  onBack: () => void
}

type ModifierOption = {
  id: string
  label: string
  diceModifier: number
}

type RangeModifierDto = {
  weaponType: string
  shortMax: number
  mediumMax: number
  longMax: number
  extremeMax: number
}

type CalculateOptionsResponse = {
  sights?: ModifierOption[]
  aimAids?: ModifierOption[]
  visibilities?: ModifierOption[]
  covers?: ModifierOption[]
  movements?: ModifierOption[]
  miscellaneousModifiers?: ModifierOption[]
  weaponTypes?: string[]
}

type CalculateResponse = Record<string, unknown>
type PanelStates = Record<string, boolean>

type CalculateFormState = {
  character: {
    attribute: number
    skill: number
    strength: number
    highPainTolerance: number
    sight: string
  }
  wounds: {
    physicalWounds: number
    mentalWounds: number
  }
  gear: {
    weaponType: string
    aimAid: string
    recoilCompensation: number
  }
  situation: {
    miscellaneous: number
    visibility: string
    modifiers: string[]
  }
  target: {
    distanceMeters: number
    cover: string
  }
  action: {
    movement: string
    shotsFired: number
    takeAim: number
  }
}

const storageKeys = {
  request: 'combat.calculate.request',
  panels: 'combat.calculate.panelStates',
} as const

const defaultFormState: CalculateFormState = {
  character: {
    attribute: 0,
    skill: 0,
    strength: 0,
    highPainTolerance: 0,
    sight: '',
  },
  wounds: {
    physicalWounds: 0,
    mentalWounds: 0,
  },
  gear: {
    weaponType: '',
    aimAid: '',
    recoilCompensation: 0,
  },
  situation: {
    miscellaneous: 0,
    visibility: '',
    modifiers: [],
  },
  target: {
    distanceMeters: 0,
    cover: '',
  },
  action: {
    movement: '',
    shotsFired: 0,
    takeAim: 0,
  },
}

const clampNumber = (value: number, min = 0, max = 9999) =>
  Math.min(max, Math.max(min, value))

const mergeFormState = (value: unknown): CalculateFormState => {
  if (!value || typeof value !== 'object') {
    return defaultFormState
  }

  const source = value as Partial<CalculateFormState>

  return {
    character: {
      attribute:
        typeof source.character?.attribute === 'number'
          ? source.character.attribute
          : defaultFormState.character.attribute,
      skill:
        typeof source.character?.skill === 'number'
          ? source.character.skill
          : defaultFormState.character.skill,
      strength:
        typeof source.character?.strength === 'number'
          ? source.character.strength
          : defaultFormState.character.strength,
      highPainTolerance:
        typeof source.character?.highPainTolerance === 'number'
          ? source.character.highPainTolerance
          : defaultFormState.character.highPainTolerance,
      sight:
        typeof source.character?.sight === 'string'
          ? source.character.sight
          : defaultFormState.character.sight,
    },
    wounds: {
      physicalWounds:
        typeof source.wounds?.physicalWounds === 'number'
          ? source.wounds.physicalWounds
          : defaultFormState.wounds.physicalWounds,
      mentalWounds:
        typeof source.wounds?.mentalWounds === 'number'
          ? source.wounds.mentalWounds
          : defaultFormState.wounds.mentalWounds,
    },
    gear: {
      weaponType:
        typeof source.gear?.weaponType === 'string'
          ? source.gear.weaponType
          : defaultFormState.gear.weaponType,
      aimAid:
        typeof source.gear?.aimAid === 'string'
          ? source.gear.aimAid
          : defaultFormState.gear.aimAid,
      recoilCompensation:
        typeof source.gear?.recoilCompensation === 'number'
          ? source.gear.recoilCompensation
          : defaultFormState.gear.recoilCompensation,
    },
    situation: {
      miscellaneous:
        typeof source.situation?.miscellaneous === 'number'
          ? source.situation.miscellaneous
          : defaultFormState.situation.miscellaneous,
      visibility:
        typeof source.situation?.visibility === 'string'
          ? source.situation.visibility
          : defaultFormState.situation.visibility,
      modifiers:
        Array.isArray(source.situation?.modifiers) &&
        source.situation.modifiers.every((entry) => typeof entry === 'string')
          ? source.situation.modifiers
          : defaultFormState.situation.modifiers,
    },
    target: {
      distanceMeters:
        typeof source.target?.distanceMeters === 'number'
          ? source.target.distanceMeters
          : defaultFormState.target.distanceMeters,
      cover:
        typeof source.target?.cover === 'string'
          ? source.target.cover
          : defaultFormState.target.cover,
    },
    action: {
      movement:
        typeof source.action?.movement === 'string'
          ? source.action.movement
          : defaultFormState.action.movement,
      shotsFired:
        typeof source.action?.shotsFired === 'number'
          ? source.action.shotsFired
          : defaultFormState.action.shotsFired,
      takeAim:
        typeof source.action?.takeAim === 'number'
          ? source.action.takeAim
          : defaultFormState.action.takeAim,
    },
  }
}

const readStoredFormState = (): CalculateFormState => {
  if (typeof window === 'undefined') {
    return defaultFormState
  }

  const storedValue = window.localStorage.getItem(storageKeys.request)

  if (!storedValue) {
    return defaultFormState
  }

  try {
    return mergeFormState(JSON.parse(storedValue) as unknown)
  } catch {
    return defaultFormState
  }
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

const formatModifierLabel = (modifier: ModifierOption) =>
  modifier.diceModifier === 0
    ? modifier.label
    : `${modifier.label} (${modifier.diceModifier >= 0 ? '+' : ''}${modifier.diceModifier})`

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const pruneValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const nextValue = value
      .map((entry) => pruneValue(entry))
      .filter((entry) => entry !== undefined)

    return nextValue.length > 0 ? nextValue : undefined
  }

  if (value && typeof value === 'object') {
    const nextEntries = Object.entries(value).reduce<Record<string, unknown>>(
      (result, [key, entryValue]) => {
        const prunedValue = pruneValue(entryValue)

        if (prunedValue !== undefined) {
          result[key] = prunedValue
        }

        return result
      },
      {},
    )

    return Object.keys(nextEntries).length > 0 ? nextEntries : undefined
  }

  if (typeof value === 'string') {
    return value.trim() ? value : undefined
  }

  return value
}

type StepperFieldProps = {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

function StepperField({
  label,
  value,
  min = 0,
  max = 9999,
  onChange,
}: StepperFieldProps) {
  return (
    <div className="stepper-field">
      <div className="stepper-header">
        <span className="stepper-label">{label}</span>
      </div>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-button"
          onClick={() => onChange(clampNumber(value - 1, min, max))}
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
          onClick={() => onChange(clampNumber(value + 1, min, max))}
          disabled={value >= max}
          aria-label={`${label} erhoehen`}
        >
          +
        </button>
      </div>
    </div>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="slider-field">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
      </div>
      <select
        className="select-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Bitte waehlen</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type NumberInputFieldProps = {
  label: string
  value: number
  min?: number
  max?: number
  displayValue?: string | number
  onChange: (value: number) => void
}

function NumberInputField({
  label,
  value,
  min = 0,
  max = 9999,
  displayValue,
  onChange,
}: NumberInputFieldProps) {
  return (
    <label className="slider-field">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <strong className="slider-value">{displayValue ?? value}</strong>
      </div>
      <input
        className="number-input"
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          const sanitizedValue = event.target.value.replace(/^0+(?=\d)/, '')
          const parsedValue = Number(sanitizedValue)
          onChange(
            Number.isNaN(parsedValue)
              ? min
              : clampNumber(parsedValue, min, max),
          )
        }}
      />
    </label>
  )
}

function CombatAssistantPage({ onBack }: CombatAssistantPageProps) {
  const [formState, setFormState] = useState<CalculateFormState>(() =>
    readStoredFormState(),
  )
  const [panelStates, setPanelStates] = useState<PanelStates>(() =>
    readStoredPanelStates(),
  )
  const [calculateOptions, setCalculateOptions] =
    useState<CalculateOptionsResponse | null>(null)
  const [rangeOptions, setRangeOptions] = useState<RangeModifierDto[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiResponse, setApiResponse] = useState<CalculateResponse | string | null>(
    null,
  )
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      setOptionsError(null)

      try {
        const [optionsResponse, rangeResponse] = await Promise.all([
          fetch(getApiUrl('/api/modifier-combat/calculate-options')),
          fetch(getApiUrl('/api/modifier-combat/range-modifiers')),
        ])
        const [optionsText, rangeText] = await Promise.all([
          optionsResponse.text(),
          rangeResponse.text(),
        ])

        if (!optionsResponse.ok) {
          throw new Error(
            optionsText || `Request failed with status ${optionsResponse.status}`,
          )
        }

        if (!rangeResponse.ok) {
          throw new Error(
            rangeText || `Request failed with status ${rangeResponse.status}`,
          )
        }

        setCalculateOptions(JSON.parse(optionsText) as CalculateOptionsResponse)
        setRangeOptions(JSON.parse(rangeText) as RangeModifierDto[])
      } catch (error) {
        setOptionsError(
          error instanceof Error ? error.message : 'Unknown request error',
        )
      } finally {
        setIsLoadingOptions(false)
      }
    }

    void loadOptions()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.request, JSON.stringify(formState))
  }, [formState])

  useEffect(() => {
    const maxTakeAim = Math.floor(formState.character.skill / 2)

    if (formState.action.takeAim <= maxTakeAim) {
      return
    }

    setFormState((currentValue) => ({
      ...currentValue,
      action: {
        ...currentValue.action,
        takeAim: maxTakeAim,
      },
    }))
  }, [formState.action.takeAim, formState.character.skill])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.panels, JSON.stringify(panelStates))
  }, [panelStates])

  const requestPayload = (pruneValue(formState) ?? {}) as Record<string, unknown>
  const requestPayloadKey = JSON.stringify(requestPayload)

  useEffect(() => {
    const abortController = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsSubmitting(true)
      setApiError(null)

      try {
        const response = await fetch(getApiUrl('/api/modifier-combat/calculate'), {
          signal: abortController.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        })

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
        if (!abortController.signal.aborted) {
          setIsSubmitting(false)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [requestPayloadKey])

  const isPanelOpen = (panelKey: string, defaultValue = true) =>
    panelStates[panelKey] ?? defaultValue

  const handlePanelToggle = (panelKey: string, isOpen: boolean) => {
    setPanelStates((currentValue) => ({
      ...currentValue,
      [panelKey]: isOpen,
    }))
  }

  const handleReset = () => {
    window.localStorage.removeItem(storageKeys.request)
    window.localStorage.removeItem(storageKeys.panels)
    setFormState(defaultFormState)
    setPanelStates({})
    setApiResponse(null)
    setApiError(null)
  }

  const updateCharacter = (
    key: keyof CalculateFormState['character'],
    value: number | string,
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      character: {
        ...currentValue.character,
        [key]: value,
      },
    }))
  }

  const updateGear = (
    key: keyof CalculateFormState['gear'],
    value: number | string,
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      gear: {
        ...currentValue.gear,
        [key]: value,
      },
    }))
  }

  const updateSituation = (
    key: keyof CalculateFormState['situation'],
    value: number | string | string[],
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      situation: {
        ...currentValue.situation,
        [key]: value,
      },
    }))
  }

  const updateTarget = (
    key: keyof CalculateFormState['target'],
    value: number | string,
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      target: {
        ...currentValue.target,
        [key]: value,
      },
    }))
  }

  const updateAction = (
    key: keyof CalculateFormState['action'],
    value: number | string,
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      action: {
        ...currentValue.action,
        [key]: value,
      },
    }))
  }

  const updateWounds = (
    key: keyof CalculateFormState['wounds'],
    value: number,
  ) => {
    setFormState((currentValue) => ({
      ...currentValue,
      wounds: {
        ...currentValue.wounds,
        [key]: value,
      },
    }))
  }

  const toggleSituationModifier = (modifierId: string) => {
    setFormState((currentValue) => {
      const hasModifier = currentValue.situation.modifiers.includes(modifierId)

      return {
        ...currentValue,
        situation: {
          ...currentValue.situation,
          modifiers: hasModifier
            ? currentValue.situation.modifiers.filter((entry) => entry !== modifierId)
            : [...currentValue.situation.modifiers, modifierId],
        },
      }
    })
  }

  const sightOptions =
    calculateOptions?.sights?.map((option) => ({
      value: option.id,
      label: formatModifierLabel(option),
    })) ?? []

  const aimAidOptions =
    calculateOptions?.aimAids?.map((option) => ({
      value: option.id,
      label: formatModifierLabel(option),
    })) ?? []

  const visibilityOptions =
    calculateOptions?.visibilities?.map((option) => ({
      value: option.id,
      label: formatModifierLabel(option),
    })) ?? []

  const coverOptions =
    calculateOptions?.covers?.map((option) => ({
      value: option.id,
      label: formatModifierLabel(option),
    })) ?? []

  const movementOptions =
    calculateOptions?.movements?.map((option) => ({
      value: option.id,
      label: formatModifierLabel(option),
    })) ?? []

  const weaponTypeOptions =
    calculateOptions?.weaponTypes?.map((option) => ({
      value: option,
      label: formatEnumLabel(option),
    })) ?? []

  const miscellaneousOptions = calculateOptions?.miscellaneousModifiers ?? []
  const maxTakeAim = Math.floor(formState.character.skill / 2)
  const selectedRangeProfile =
    rangeOptions.find((entry) => entry.weaponType === formState.gear.weaponType) ??
    null
  const rangeModifierValue = selectedRangeProfile
    ? formState.target.distanceMeters <= selectedRangeProfile.shortMax
      ? 0
      : formState.target.distanceMeters <= selectedRangeProfile.mediumMax
        ? -1
        : formState.target.distanceMeters <= selectedRangeProfile.longMax
          ? -3
          : formState.target.distanceMeters <= selectedRangeProfile.extremeMax
            ? -6
            : -6
    : null
  const formattedRangeModifier =
    rangeModifierValue === null
      ? '-'
      : rangeModifierValue > 0
        ? `+${rangeModifierValue}`
        : String(rangeModifierValue)

  const formattedApiResponse =
    typeof apiResponse === 'string'
      ? apiResponse
      : apiResponse
        ? JSON.stringify(apiResponse, null, 2)
        : null

  const formattedRequestPreview = JSON.stringify(requestPayload, null, 2)
  const dicePoolValue =
    apiResponse && typeof apiResponse !== 'string'
      ? apiResponse.dicePool
      : null

  return (
    <main className="page page-detail">
      <section className="detail-card">
        <div className="page-toolbar">
          <p className="eyebrow">Shoot</p>
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
        {isLoadingOptions ? <p>Lade Calculate-Optionen...</p> : null}
        {optionsError ? <pre className="combat-result error">{optionsError}</pre> : null}
        <div className="combat-form combat-form-secondary">
          <details
            className="control-panel"
            open={isPanelOpen('group:action')}
            onToggle={(event) =>
              handlePanelToggle('group:action', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">action</span>
            </summary>
            <div className="control-panel-body">
              <SelectField
                label="movement"
                value={formState.action.movement}
                options={movementOptions}
                onChange={(value) => updateAction('movement', value)}
              />
              <StepperField
                label="shotsFired"
                value={formState.action.shotsFired}
                min={1}
                max={15}
                onChange={(value) => updateAction('shotsFired', value)}
              />
              <StepperField
                label="takeAim"
                value={formState.action.takeAim}
                min={0}
                max={maxTakeAim}
                onChange={(value) => updateAction('takeAim', value)}
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('group:target')}
            onToggle={(event) =>
              handlePanelToggle('group:target', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">target</span>
            </summary>
            <div className="control-panel-body">
              <NumberInputField
                label="distanceMeters"
                value={formState.target.distanceMeters}
                min={0}
                max={3000}
                displayValue={formattedRangeModifier}
                onChange={(value) => updateTarget('distanceMeters', value)}
              />
              <SelectField
                label="cover"
                value={formState.target.cover}
                options={coverOptions}
                onChange={(value) => updateTarget('cover', value)}
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('group:situation')}
            onToggle={(event) =>
              handlePanelToggle('group:situation', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">situation</span>
            </summary>
            <div className="control-panel-body">
              <StepperField
                label="miscellaneous"
                value={formState.situation.miscellaneous}
                min={0}
                max={20}
                onChange={(value) => updateSituation('miscellaneous', value)}
              />
              <SelectField
                label="visibility"
                value={formState.situation.visibility}
                options={visibilityOptions}
                onChange={(value) => updateSituation('visibility', value)}
              />
              <div className="modifier-section">
                <h3 className="modifier-title">modifiers</h3>
                <div className="modifier-grid">
                  {miscellaneousOptions.map((modifier) => (
                    <label key={modifier.id} className="modifier-option">
                      <input
                        type="checkbox"
                        checked={formState.situation.modifiers.includes(modifier.id)}
                        onChange={() => toggleSituationModifier(modifier.id)}
                      />
                      <span>{formatModifierLabel(modifier)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('group:wounds')}
            onToggle={(event) =>
              handlePanelToggle('group:wounds', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">wounds</span>
            </summary>
            <div className="control-panel-body">
              <StepperField
                label="physicalWounds"
                value={formState.wounds.physicalWounds}
                min={0}
                max={12}
                onChange={(value) => updateWounds('physicalWounds', value)}
              />
              <StepperField
                label="mentalWounds"
                value={formState.wounds.mentalWounds}
                min={0}
                max={12}
                onChange={(value) => updateWounds('mentalWounds', value)}
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('group:gear')}
            onToggle={(event) =>
              handlePanelToggle('group:gear', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">gear</span>
            </summary>
            <div className="control-panel-body">
              <SelectField
                label="weaponType"
                value={formState.gear.weaponType}
                options={weaponTypeOptions}
                onChange={(value) => updateGear('weaponType', value)}
              />
              <SelectField
                label="aimAid"
                value={formState.gear.aimAid}
                options={aimAidOptions}
                onChange={(value) => updateGear('aimAid', value)}
              />
              <StepperField
                label="recoilCompensation"
                value={formState.gear.recoilCompensation}
                max={20}
                onChange={(value) => updateGear('recoilCompensation', value)}
              />
            </div>
          </details>
          <details
            className="control-panel"
            open={isPanelOpen('group:character')}
            onToggle={(event) =>
              handlePanelToggle('group:character', event.currentTarget.open)
            }
          >
            <summary className="control-panel-summary">
              <span className="control-panel-title">character</span>
            </summary>
            <div className="control-panel-body">
              <StepperField
                label="attribute"
                value={formState.character.attribute}
                min={1}
                max={12}
                onChange={(value) => updateCharacter('attribute', value)}
              />
              <StepperField
                label="skill"
                value={formState.character.skill}
                min={0}
                max={12}
                onChange={(value) => updateCharacter('skill', value)}
              />
              <StepperField
                label="strength"
                value={formState.character.strength}
                min={1}
                max={15}
                onChange={(value) => updateCharacter('strength', value)}
              />
              <StepperField
                label="highPainTolerance"
                value={formState.character.highPainTolerance}
                min={0}
                max={10}
                onChange={(value) => updateCharacter('highPainTolerance', value)}
              />
              <SelectField
                label="sight"
                value={formState.character.sight}
                options={sightOptions}
                onChange={(value) => updateCharacter('sight', value)}
              />
            </div>
          </details>
        </div>
        <details
          className="combat-preview"
          open={isPanelOpen('debug', false)}
          onToggle={(event) => handlePanelToggle('debug', event.currentTarget.open)}
        >
          <summary className="combat-preview-summary">Debug</summary>
          <div className="debug-panel">
            <div className="debug-section">
              <p className="response-label">Calculate Request</p>
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
            {isSubmitting ? (
              <p className="response-label">Berechnung wird aktualisiert...</p>
            ) : null}
          </div>
        </details>
        <button className="back-button" onClick={onBack}>
          Zurueck zur Startseite
        </button>
      </section>
    </main>
  )
}

export default CombatAssistantPage
