export default function AdminMatchesLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-48 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
