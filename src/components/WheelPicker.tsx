import { useEffect, useRef } from 'react'

type WheelPickerProps = {
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}

const itemHeight = 52

function WheelPicker({ label, min, max, value, onChange }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const nextScrollTop = (value - min) * itemHeight

    if (Math.abs(container.scrollTop - nextScrollTop) > 1) {
      container.scrollTo({
        top: nextScrollTop,
        behavior: 'smooth',
      })
    }
  }, [max, min, value])

  const handleScroll = () => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const nextIndex = Math.round(container.scrollTop / itemHeight)
    const nextValue = Math.min(max, Math.max(min, min + nextIndex))

    if (nextValue !== value) {
      onChange(nextValue)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(Math.max(min, value - 1))
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(Math.min(max, value + 1))
    }
  }

  return (
    <div className="wheel-field">
      <span className="wheel-label">{label}</span>
      <div className="wheel-picker-shell">
        <div className="wheel-picker-highlight" aria-hidden="true" />
        <div
          ref={containerRef}
          className="wheel-picker"
          role="spinbutton"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
        >
          <div className="wheel-spacer" aria-hidden="true" />
          {values.map((entry) => (
            <div
              key={entry}
              className={entry === value ? 'wheel-item active' : 'wheel-item'}
            >
              {entry}
            </div>
          ))}
          <div className="wheel-spacer" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default WheelPicker
