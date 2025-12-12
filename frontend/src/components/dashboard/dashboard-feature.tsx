import { lazy } from 'react'

const LazyVoting = lazy(() => import('@/components/voting/voting-feature'))

export default function DashboardFeature() {
  return (
    <div className="py-6">
      <LazyVoting />
    </div>
  )
}
