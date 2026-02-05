'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-lg bg-muted/60",
        className
      )}
    />
  )
}

// Card Skeleton
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === 0 ? "w-32" : "w-16 flex-shrink-0"
          )} 
        />
      ))}
    </div>
  )
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            {[1, 2, 3, 4, 5].map(i => (
              <TableRowSkeleton key={i} columns={4} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

// List Skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

// Meal Grid Skeleton
export function MealGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => (
          <CardSkeleton key={i} className="p-3" />
        ))}
      </div>
      
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-muted/50 p-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-12" />
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <TableRowSkeleton key={i} columns={6} />
        ))}
      </div>
    </div>
  )
}
