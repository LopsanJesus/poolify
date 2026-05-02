export default function ClanSettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-40 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </div>

      <div className="skeleton h-44 rounded-2xl" />
      <div className="skeleton h-32 rounded-2xl" />
      <div className="skeleton h-10 w-36 rounded-lg" />
    </div>
  )
}
