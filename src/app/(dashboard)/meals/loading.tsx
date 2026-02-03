import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function MealsLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-24 lg:pb-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 bg-muted rounded-md w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded-md w-64"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded-md w-32"></div>
          <div className="h-10 bg-muted rounded-md w-32"></div>
        </div>
      </div>

      {/* Meal Grid Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded-md w-40"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-2">
                <div className="h-10 bg-muted rounded-md col-span-2"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-10 bg-muted rounded-md"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
