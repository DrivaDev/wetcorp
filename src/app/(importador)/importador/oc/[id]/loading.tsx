export default function OCDetailLoading() {
  return (
    <div className="bg-fondo min-h-screen">
      <header className="bg-white border-b border-acento px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-acento/30 animate-pulse" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-7 w-24 rounded bg-acento/30 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-acento/40 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 rounded-lg bg-acento/30 animate-pulse" />
              <div className="h-10 w-24 rounded-lg bg-acento/30 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="rounded-xl border border-acento bg-white p-6">
          <div className="h-5 w-28 rounded bg-acento/30 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-acento/20" />
            ))}
          </div>
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-acento bg-white p-6">
            <div className="h-5 w-36 rounded bg-acento/30 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-10 rounded-lg bg-acento/20" />
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-acento bg-white p-4 h-20 bg-acento/20" />
          ))}
        </div>

        <div className="rounded-xl border border-acento bg-white divide-y divide-acento/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-4 w-4 rounded bg-acento/30 shrink-0" />
              <div className="h-4 flex-1 rounded bg-acento/20" />
              <div className="h-8 w-20 rounded-lg bg-acento/30" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
