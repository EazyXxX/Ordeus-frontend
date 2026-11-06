import { Link, NavLink, useLocation } from 'react-router'

import { AccountMenu } from '@/app/account/AccountMenu'
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
        <Link
          to="/"
          aria-label="Ordeus, на главную"
          onClick={() => setOpenMobile(false)}
          className="flex h-8 items-center gap-2 rounded-md px-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:px-1.5"
        >
          <img src="/favicon.svg" alt="" className="size-5 shrink-0 dark:invert" />
          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Ordeus</span>
        </Link>
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
        <AccountMenu />
        <ServerStatus />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
