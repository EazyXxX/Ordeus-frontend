import { Coffee, Monitor, Moon, MoonStar, Sun, Zap, type LucideIcon } from 'lucide-react'

import { t } from '@/i18n'
import { useTheme, THEMES, type Theme } from '@/app/theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

const THEME_LABELS: Record<Theme, string> = {
  light: t('theme.light'),
  dark: t('theme.dark'),
  system: t('theme.system'),
  beige: t('theme.beige'),
  midnight: t('theme.midnight'),
  acid: t('theme.acid'),
}

const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
  beige: Coffee,
  midnight: MoonStar,
  acid: Zap,
}

// The plain themes first, then the colored ones under a line.
const FIRST_COLORED: Theme = 'beige'

export function ThemeMenu() {
  const { theme, changeTheme } = useTheme()
  const CurrentIcon = THEME_ICONS[theme]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={t('theme.title')} aria-label={t('theme.current', { name: THEME_LABELS[theme] })}>
              <CurrentIcon />
              <span>{THEME_LABELS[theme]}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => changeTheme(value as Theme)}>
              {THEMES.map((value) => {
                const Icon = THEME_ICONS[value]
                return [
                  value === FIRST_COLORED && <DropdownMenuSeparator key="separator" />,
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon />
                    {THEME_LABELS[value]}
                  </DropdownMenuRadioItem>,
                ]
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
