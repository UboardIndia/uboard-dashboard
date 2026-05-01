'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem { label: string; href: string; roles: string[] }

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['reconciler', 'supervisor', 'admin'] },
  { label: 'Report', href: '/report', roles: ['reconciler', 'supervisor', 'admin'] },
  { label: 'Clearance', href: '/clearance', roles: ['reconciler'] },
  { label: 'Sign-off', href: '/signoff', roles: ['supervisor'] },
  { label: 'History', href: '/history', roles: ['reconciler', 'supervisor', 'admin'] },
  { label: 'Salary Report', href: '/admin/salary', roles: ['admin'] },
  { label: 'Users', href: '/admin/users', roles: ['admin'] },
  { label: 'All Cycles', href: '/admin/cycles', roles: ['admin'] },
]

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const r = localStorage.getItem('role') ?? ''
    const n = localStorage.getItem('userName') ?? ''
    if (!token) { router.replace('/login'); return }
    if (r === 'factory_staff') { router.replace('/home'); return }
    setRole(r)
    setName(n)
  }, [router])

  const visibleNav = NAV.filter((n) => n.roles.includes(role))

  async function handleLogout() {
    const token = localStorage.getItem('token')
    await fetch('/api/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    localStorage.clear()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="text-blue-700 font-bold text-lg">U-Board</div>
          <div className="text-gray-400 text-xs">Stock System</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Preview mobile screens — admin only */}
          {role === 'admin' && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview Mobile</div>
              {[
                { label: 'Home Screen', href: '/home' },
                { label: 'Gopalji / Altab / Furkan', href: '/submit/readiness' },
                { label: 'Kashif — Defects', href: '/submit/defects' },
                { label: 'Arjun — Count', href: '/submit/count' },
                { label: 'Arti — Returns', href: '/submit/returns' },
                { label: 'Mera Status', href: '/checklist' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700">{name}</div>
          <div className="text-xs text-gray-400 capitalize mb-3">{role}</div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700">Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
