'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.locked) {
          setError(`3 baar galat try hua. ${data.minsLeft} minute baad try karo.`)
        } else {
          setError('Number ya password galat hai. Dobara try karo.')
        }
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)
      localStorage.setItem('userId', data.user.id)
      localStorage.setItem('userName', data.user.name)

      if (data.user.role === 'factory_staff' || data.user.role === 'supervisor') {
        router.replace('/home')
      } else {
        router.replace('/dashboard')
      }
    } catch {
      setError('Internet nahi hai. Thodi der baad try karo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-4xl font-bold text-blue-700 mb-1">U-Board</div>
          <div className="text-gray-500 text-sm">Stock System</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Stock System mein Login Karo
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-blue-700 text-white text-lg font-semibold rounded-xl mt-2 disabled:opacity-60 active:bg-blue-800"
          >
            {loading ? 'Loading...' : 'Login Karo'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Password bhool gaye? Admin se poocho.
        </p>
      </div>
    </div>
  )
}
