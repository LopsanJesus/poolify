export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse-subtle">
      <div className="space-y-2">
        <div className="skeleton h-7 w-44 rounded-lg" />
        <div className="skeleton h-4 w-60 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="skeleton h-[76px] rounded-2xl" />
        <div className="skeleton h-[76px] rounded-2xl" />
      </div>

      <div className="space-y-3">
        <div className="skeleton h-5 w-32 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[64px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
