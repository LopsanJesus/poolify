export default function MatchesLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="skeleton h-7 w-32 rounded-lg" />
          <div className="skeleton h-5 w-24 rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="space-y-3">
        <div className="skeleton h-5 w-40 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="skeleton h-5 w-36 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
