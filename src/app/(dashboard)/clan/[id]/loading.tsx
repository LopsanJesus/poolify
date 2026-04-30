export default function ClanLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="space-y-1.5">
            <div className="skeleton h-7 w-48 rounded-lg" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="skeleton h-5 w-36 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="skeleton h-5 w-40 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>

      <div className="space-y-2">
        <div className="skeleton h-5 w-28 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-[68px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
