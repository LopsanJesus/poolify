export default function PersonalInfoLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="skeleton h-7 w-56 rounded-lg" />
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  )
}
