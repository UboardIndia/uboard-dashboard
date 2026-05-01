'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role === 'factory_staff' || role === 'supervisor') {
      router.replace('/home')
    } else {
      router.replace('/dashboard')
    }
  }, [router])
  return null
}
