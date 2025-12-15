'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Organization {
  id: string
  name: string
  sport: string | null
  admin_count: number
  athlete_count: number
  created_at: string
}

interface Invite {
  id: string
  email: string
  role: string
  code: string
  is_valid: boolean
  created_at: string
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)

  // New org form
  const [showNewOrgForm, setShowNewOrgForm] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSport, setNewOrgSport] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'athlete'>('admin')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user?.is_superadmin) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await apiGet<Organization[]>('/organizations')
        setOrganizations(orgs)
      } catch (err) {
        console.error('Failed to load organizations:', err)
      } finally {
        setIsLoadingOrgs(false)
      }
    }

    if (user?.is_superadmin) {
      loadOrganizations()
    }
  }, [user])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrg(true)
    try {
      const org = await apiPost<Organization>('/organizations', {
        name: newOrgName,
        sport: newOrgSport || null,
      })
      setOrganizations([org, ...organizations])
      setShowNewOrgForm(false)
      setNewOrgName('')
      setNewOrgSport('')
    } catch (err) {
      console.error('Failed to create organization:', err)
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) return

    setIsCreatingInvite(true)
    try {
      const invite = await apiPost<Invite>('/invites', {
        email: inviteEmail,
        organization_id: selectedOrgId,
        role: inviteRole,
      })
      setLastInviteCode(invite.code)
      setInviteEmail('')
    } catch (err: any) {
      alert(err.data?.detail || 'Failed to create invite')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  if (isLoading || !user?.is_superadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {user.first_name}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Organization */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
            <Button onClick={() => setShowNewOrgForm(!showNewOrgForm)}>
              {showNewOrgForm ? 'Cancel' : '+ New Organization'}
            </Button>
          </div>

          {showNewOrgForm && (
            <form onSubmit={handleCreateOrg} className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-4">Create New Organization</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <Input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g., Volleyball Canada"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport
                  </label>
                  <Input
                    value={newOrgSport}
                    onChange={(e) => setNewOrgSport(e.target.value)}
                    placeholder="e.g., Volleyball"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isCreatingOrg || !newOrgName}>
                {isCreatingOrg ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          )}

          {/* Organizations List */}
          {isLoadingOrgs ? (
            <div className="text-center py-8">Loading organizations...</div>
          ) : organizations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No organizations yet. Create your first one!
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Admins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Athletes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {org.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {org.sport || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {org.admin_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {org.athlete_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrgId(org.id)
                            setShowInviteForm(true)
                            setLastInviteCode(null)
                          }}
                        >
                          Invite Admin
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteForm && selectedOrgId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">
                Invite {inviteRole === 'admin' ? 'Admin' : 'Athlete'}
              </h3>

              {lastInviteCode ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2">Invite created!</p>
                    <p className="text-sm text-green-700 mb-2">
                      Share this link with the invitee:
                    </p>
                    <div className="bg-white p-2 rounded border text-sm break-all">
                      {typeof window !== 'undefined' && window.location.origin}/signup?code={lastInviteCode}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/signup?code=${lastInviteCode}`
                        )
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLastInviteCode(null)
                        setShowInviteForm(false)
                        setSelectedOrgId(null)
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'admin' | 'athlete')}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="athlete">Athlete</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button type="submit" disabled={isCreatingInvite || !inviteEmail}>
                      {isCreatingInvite ? 'Creating...' : 'Create Invite'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowInviteForm(false)
                        setSelectedOrgId(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
