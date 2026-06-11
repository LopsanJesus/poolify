export default function AdminMembersLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-48 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="skeleton h-5 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
