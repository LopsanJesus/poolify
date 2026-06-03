export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="skeleton h-12 rounded-xl" />
      <div className="space-y-4">
        {[0,1,2,3,4].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
