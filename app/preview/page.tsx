'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const SCREENS = [
  { label: 'Home', href: '/home' },
  { label: 'Gopalji — Tranzact Ready', href: '/submit/readiness?as=Gopalji' },
  { label: 'Altab — Sheet Ready', href: '/submit/readiness?as=Altab' },
  { label: 'Furkan — Closing Stock', href: '/submit/readiness?as=Furkan' },
  { label: 'Kashif — Defects', href: '/submit/defects' },
  { label: 'Arjun — Physical Count', href: '/submit/count' },
  { label: 'Arti — Returns', href: '/submit/returns' },
  { label: 'Mera Status', href: '/checklist' },
]

export default function PreviewPage() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'admin') { router.replace('/home'); return }
    setAuthed(true)
  }, [router])

  function scrollTo(i: number) {
    if (!scrollRef.current) return
    const w = scrollRef.current.clientWidth
    scrollRef.current.scrollTo({ left: i * w, behavior: 'smooth' })
  }

  function onScroll() {
    if (!scrollRef.current) return
    const w = scrollRef.current.clientWidth
    const i = Math.round(scrollRef.current.scrollLeft / w)
    if (i !== activeIdx) setActiveIdx(i)
  }

  function handleLogout() {
    localStorage.clear()
    router.replace('/login')
  }

  if (!authed) return null

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Top bar */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3 border-b border-gray-800">
        <div className="font-bold text-blue-400">U-Board Admin Preview</div>
        <div className="flex-1 overflow-x-auto whitespace-nowrap">
          {SCREENS.map((s, i) => (
            <button
              key={s.href}
              onClick={() => scrollTo(i)}
              className={`text-xs px-3 py-1.5 rounded-full mr-2 transition-colors ${
                i === activeIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
        >
          Web Dashboard
        </button>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
        >
          Logout
        </button>
      </div>

      {/* Swipeable screens */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {SCREENS.map((s) => (
          <div key={s.href} className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center bg-gray-800 p-4">
            <div className="bg-black rounded-[2rem] p-2 shadow-2xl" style={{ width: 390, height: '90%', maxHeight: 800 }}>
              <iframe
                src={s.href}
                title={s.label}
                className="w-full h-full rounded-[1.5rem] bg-white border-0"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicator */}
      <div className="bg-gray-900 py-2 flex justify-center gap-2 border-t border-gray-800">
        {SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === activeIdx ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
