import { LogOut, Plus, UserRound } from 'lucide-react'
import { Link } from 'react-router'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { AccountAvatar } from './AccountAvatar'
import { enterApp, signOut, switchAccount, useSession } from './session'

export function AccountMenu() {
  const { data: session } = useSession()
  const { setOpenMobile } = useSidebar()
  if (!session) return null

  const { user, accounts } = session

  async function changeAccount(userId: string) {
    if (userId === user.id) return
    await switchAccount(userId)
    enterApp()
  }

  async function leave() {
    await signOut()
    enterApp()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={user.name} aria-label={`Аккаунт: ${user.name}`}>
              <AccountAvatar name={user.name} color={user.color} />
              <span className="truncate">{user.name}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={user.id} onValueChange={changeAccount}>
              {accounts.map((account) => (
                <DropdownMenuRadioItem key={account.id} value={account.id}>
                  <AccountAvatar name={account.name} color={account.color} />
                  <span className="truncate">{account.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login?add=1">
                <Plus />
                Добавить аккаунт
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account" onClick={() => setOpenMobile(false)}>
                <UserRound />
                Личный кабинет
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={leave}>
              <LogOut />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
