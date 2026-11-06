import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1 text-sm outline-none max-lg:py-1.5 focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
  )

type ModeTabsProps = {
  label: string
  // The first tab is the section's root path.
  tabs: { to: string; label: string }[]
}

export function ModeTabs({ label, tabs }: ModeTabsProps) {
  return (
    <nav aria-label={label} className="flex shrink-0 gap-1 border-b p-2">
      {tabs.map((tab, index) => (
        <NavLink key={tab.to} to={tab.to} end={index === 0} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
