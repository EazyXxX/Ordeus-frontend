import { t } from '@/i18n'
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { COLOR_DOT, COLOR_LABELS, COLORS, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'

type ColorSubmenuProps = {
  value: Color
  onChange: (color: Color) => void
}

export function ColorSubmenu({ value, onChange }: ColorSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t('common.color')}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as Color)}>
          {COLORS.map((color) => (
            <DropdownMenuRadioItem key={color} value={color}>
              <span className={cn('size-2.5 rounded-full', COLOR_DOT[color])} aria-hidden />
              {COLOR_LABELS[color]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
