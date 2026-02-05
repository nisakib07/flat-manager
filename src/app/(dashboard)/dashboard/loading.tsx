import { DashboardSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="pb-24 lg:pb-8">
      <DashboardSkeleton />
    </div>
  )
}
