import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/app/AppShell'
import { AuthPage } from '@/app/account/AuthPage'
import { RequireAuth } from '@/app/account/RequireAuth'
import { RouteError } from '@/app/RouteError'
import { modules } from '@/modules/registry'

const home = modules[0].path

export const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" />, errorElement: <RouteError /> },
  { path: '/register', element: <AuthPage mode="register" />, errorElement: <RouteError /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to={home} replace /> },
      ...modules.map(({ path, load }) => ({
        path: `${path}/*`,
        errorElement: <RouteError />,
        lazy: async () => ({ Component: (await load()).default }),
      })),
      {
        path: '/account',
        errorElement: <RouteError />,
        lazy: async () => ({ Component: (await import('@/app/account/AccountPage')).default }),
      },
      { path: '*', element: <Navigate to={home} replace /> },
    ],
  },
])
