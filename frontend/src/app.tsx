import { AppProviders } from '@/components/app-providers'
import { AppLayout } from '@/components/app-layout'
import { RouteObject, useRoutes } from 'react-router'
import { lazy } from 'react'

const links = [
  { label: 'Home', path: '/' },
  { label: 'Create Poll', path: '/create-poll' },
  { label: 'Account', path: '/account' },
]

const LazyAccountIndex = lazy(() => import('@/components/account/account-index-feature'))
const LazyAccountDetail = lazy(() => import('@/components/account/account-detail-feature'))
const LazyDashboard = lazy(() => import('@/components/dashboard/dashboard-feature'))
const LazyCreatePoll = lazy(() => import('@/components/voting/create-poll-feature'))

const routes: RouteObject[] = [
  { index: true, element: <LazyDashboard /> },
  { path: 'create-poll', element: <LazyCreatePoll /> },
  {
    path: 'account',
    children: [
      { index: true, element: <LazyAccountIndex /> },
      { path: ':address', element: <LazyAccountDetail /> },
    ],
  },
]

export function App() {
  const router = useRoutes(routes)
  return (
    <AppProviders>
      <AppLayout links={links}>{router}</AppLayout>
    </AppProviders>
  )
}
