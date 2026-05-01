'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User { id: string; name: string; phone: string; role: string; is_active: string; last_login: string }

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', role: 'factory_staff', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadUsers() {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).catch(() => null)
    setUsers(res?.users ?? [])
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token) { router.replace('/login'); return }
    if (role !== 'admin') { router.replace('/dashboard'); return }
    loadUsers().then(() => setLoading(false))
  }, [router])

  async function handleCreate() {
    setError(''); setSaving(true)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    }).then((r) => r.json()).catch(() => null)
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    setCreating(false); setForm({ name: '', phone: '', role: 'factory_staff', password: '' })
    loadUsers()
  }

  async function toggleActive(userId: string, currentActive: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/v1/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: currentActive !== 'true' }),
    })
    loadUsers()
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium">+ Create User</button>
      </div>

      {creating && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">New User</h2>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            {['name', 'phone', 'password'].map((field) => (
              <div key={field}>
                <label className="block text-sm text-gray-600 mb-1 capitalize">{field}</label>
                <input value={form[field as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  type={field === 'password' ? 'password' : 'text'}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="factory_staff">factory_staff</option>
                <option value="supervisor">supervisor</option>
                <option value="reconciler">reconciler</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setCreating(false); setError('') }} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Phone', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-50">
                <td className="px-6 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-6 py-3 text-gray-600">{user.phone}</td>
                <td className="px-6 py-3">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{user.role}</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${user.is_active === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {user.is_active === 'true' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">{user.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3">
                  <button onClick={() => toggleActive(user.id, user.is_active)}
                    className="text-xs text-blue-700 hover:underline mr-3">
                    {user.is_active === 'true' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
