import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'

import { useTheme, THEMES, type Theme } from '@/app/theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

const THEME_LABELS: Record<Theme, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Как в системе',
}

const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeMenu() {
  const { theme, changeTheme } = useTheme()
  const CurrentIcon = THEME_ICONS[theme]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip="Тема" aria-label={`Тема: ${THEME_LABELS[theme]}`}>
              <CurrentIcon />
              <span>{THEME_LABELS[theme]}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => changeTheme(value as Theme)}>
              {THEMES.map((value) => {
                const Icon = THEME_ICONS[value]
                return (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon />
                    {THEME_LABELS[value]}
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
