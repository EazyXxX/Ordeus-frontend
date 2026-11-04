import { Outlet, useLocation } from 'react-router'

import { AppSidebar } from '@/app/AppSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { modules } from '@/modules/registry'

export function AppShell() {
  const { pathname } = useLocation()
  const current = modules.find((module) => pathname.startsWith(module.path))

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-sm font-medium">{current?.title}</h1>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
