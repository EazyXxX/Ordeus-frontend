import { Ban } from 'lucide-react'

import { COLOR_DOT, COLOR_LABELS, COLORS, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'

const swatchClass = 'size-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
const selectedClass = 'ring-2 ring-foreground ring-offset-2 ring-offset-background'

type ColorPickerProps<Value extends Color | ''> = {
  value: Value
  allowNone?: boolean
  onChange: (color: Value) => void
}

export function ColorPicker<Value extends Color | ''>({ value, allowNone, onChange }: ColorPickerProps<Value>) {
  return (
    <div role="radiogroup" aria-label="Цвет" className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">Цвет</span>
      <div className="flex flex-wrap gap-1.5">
        {allowNone && (
          <button
            type="button"
            role="radio"
            aria-checked={value === ''}
            aria-label="Без цвета"
            title="Без цвета"
            onClick={() => onChange('' as Value)}
            className={cn(
              swatchClass,
              'flex items-center justify-center border text-muted-foreground',
              value === '' && selectedClass,
            )}
          >
            <Ban className="size-3.5" aria-hidden />
          </button>
        )}
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={COLOR_LABELS[color]}
            title={COLOR_LABELS[color]}
            onClick={() => onChange(color as Value)}
            className={cn(swatchClass, COLOR_DOT[color], value === color && selectedClass)}
          />
        ))}
      </div>
    </div>
  )
}
