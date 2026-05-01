'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {children}
    </div>
  )
}
