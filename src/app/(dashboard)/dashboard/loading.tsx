import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-24 lg:pb-8">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-muted rounded-md w-64 mb-2"></div>
        <div className="h-4 bg-muted rounded-md w-48"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Meal Table Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded-md w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-12 bg-muted rounded-md"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded-md w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded-md w-32"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-20 bg-muted rounded-md"></div>
              <div className="h-20 bg-muted rounded-md"></div>
              <div className="h-20 bg-muted rounded-md"></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded-md w-40"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-16 bg-muted rounded-md"></div>
                <div className="h-16 bg-muted rounded-md"></div>
                <div className="h-16 bg-muted rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
