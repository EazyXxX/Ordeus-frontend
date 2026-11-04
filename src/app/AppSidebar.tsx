import { NavLink, useLocation } from 'react-router'

import { ServerStatus } from '@/app/ServerStatus'
import { ThemeMenu } from '@/app/ThemeMenu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { modules } from '@/modules/registry'

export function AppSidebar() {
  const { setOpenMobile } = useSidebar()
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2">
          <img src="/favicon.svg" alt="" className="size-5 shrink-0 dark:invert" />
          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Ordeus</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map(({ title, path, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(path)} tooltip={title}>
                    <NavLink to={path} onClick={() => setOpenMobile(false)}>
                      <Icon />
                      <span>{title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeMenu />
        <ServerStatus />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
