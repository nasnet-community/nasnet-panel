/**
 * WiFi Dashboard Loading Skeleton
 * Shows placeholder content while data is loading
 */

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-56" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-28" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 md:p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mb-1" />
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2" />
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-36" />

      {/* Interface cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Clients table skeleton */}
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-40" />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

























