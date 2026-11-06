import { t } from '@/i18n'
import { COLOR_DOT, COLOR_LABELS, COLORS, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'

const swatchClass = 'size-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
const selectedClass = 'ring-2 ring-foreground ring-offset-2 ring-offset-background'

type ColorPickerProps = {
  value: Color
  onChange: (color: Color) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label={t('common.color')} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{t('common.color')}</span>
      <div className="flex flex-wrap gap-1.5">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={COLOR_LABELS[color]}
            title={COLOR_LABELS[color]}
            onClick={() => onChange(color)}
            className={cn(swatchClass, COLOR_DOT[color], value === color && selectedClass)}
          />
        ))}
      </div>
    </div>
  )
}
