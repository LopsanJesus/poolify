export default function PredictionsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      </div>

      <div className="skeleton h-20 rounded-xl" />

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
