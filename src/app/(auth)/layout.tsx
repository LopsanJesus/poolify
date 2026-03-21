import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.jpeg" alt="Poolify" width={64} height={64} className="rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Poolify</h1>
          <p className="text-blue-300 mt-1 text-sm">Porras del Mundial 2026 con tus amigos</p>
        </div>
        {children}
      </div>
    </div>
  )
}
