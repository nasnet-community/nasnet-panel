/**
 * Loading Skeleton Component
 * Simplified layout skeleton matching new dashboard design
 */

export function LoadingSkeleton() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 max-w-7xl mx-auto animate-pulse">
      {/* Interfaces Section Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-10" />
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>

        <div className="grid gap-2 md:gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Connected Devices Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>

        {/* IP Addresses Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* DHCP Section Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            </div>
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12" />
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-10 mx-auto mb-1" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-14 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
