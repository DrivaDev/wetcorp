export default function EditarOCLoading() {
  return (
    <div className="bg-fondo min-h-screen animate-pulse">
      <header className="bg-white border-b border-acento px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-acento/30" />
            <div className="h-6 w-40 rounded bg-acento/30" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-acento/30" />
        </div>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-5">
          <div className="h-5 w-40 rounded bg-acento/30" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-4 w-24 rounded bg-acento/20" />
                <div className="h-10 rounded-lg bg-acento/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-acento bg-white p-6 flex flex-col gap-4">
          <div className="h-5 w-28 rounded bg-acento/30" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-acento/10" />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 rounded-lg bg-acento/30" />
          <div className="h-10 w-36 rounded-lg bg-principal/20" />
        </div>
      </main>
    </div>
  )
}
