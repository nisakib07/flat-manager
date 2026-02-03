import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function ShoppingLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-24 lg:pb-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 bg-muted rounded-md w-40 mb-2"></div>
          <div className="h-4 bg-muted rounded-md w-56"></div>
        </div>
        <div className="h-10 bg-muted rounded-md w-40"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded-md w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded-md w-32"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded-md w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded-md w-32"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded-md w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded-md w-32"></div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping List Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded-md w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded-md w-48"></div>
                  <div className="h-3 bg-muted rounded-md w-32"></div>
                </div>
                <div className="h-6 bg-muted rounded-md w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
