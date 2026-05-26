export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-32 rounded-lg" />
          <div className="skeleton h-4 w-44 rounded" />
        </div>
      </div>

      <div className="skeleton h-20 rounded-2xl" />
      <div className="skeleton h-20 rounded-2xl" />
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton h-28 rounded-2xl" />
      <div className="skeleton h-28 rounded-2xl" />
      <div className="skeleton h-20 rounded-2xl" />
    </div>
  )
}
