'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Heart, Zap, LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CoachingTipPanel, CoachingTipsInline } from '@/components/admin/coaching-tips'
import { useIsLarge } from '@/hooks/useMediaQuery'
import {
  CORE_PILLAR_KEYS,
  PILLAR_DISPLAY_NAMES,
  META_CATEGORIES,
  type MetaCategoryKey,
  type PillarKey,
} from '@/lib/mpaDefinitions'
import { PillarTooltip } from '@/components/ui/PillarTooltip'
import { SupportingDimensionsCard } from '@/components/ui/SupportingDimensionsCard'

interface Athlete {
  id: string
  email: string
  first_name: string
  last_name: string
  joined_at: string | null
  has_completed_assessment: boolean
  assessment_completed_at: string | null
  pillar_scores: Record<string, number> | null
  meta_scores: Record<string, number> | null  // {thinking, feeling, action}
  strengths: string[] | null
  growth_areas: string[] | null
}

const META_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  thinking: { icon: Brain, color: 'text-slate-600' },
  feeling: { icon: Heart, color: 'text-amber-600' },
  action: { icon: Zap, color: 'text-teal-600' },
}

function MetaScoreBadge({ category, score }: { category: string; score: number }) {
  const meta = META_CATEGORIES[category as MetaCategoryKey]
  const colors = meta || { bg: 'bg-gray-100', text: 'text-gray-700', name: category }
  const iconData = META_ICONS[category]
  const IconComponent = iconData?.icon

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${colors.bg}`}>
      {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${iconData.color}`} />}
      <span className={`text-xs font-medium ${colors.text}`}>
        {meta?.name || category}
      </span>
      <span className={`text-xs font-bold ${colors.text}`}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function ScoreBar({ score, maxScore = 7 }: { score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100
  let colorClass = 'bg-yellow-500'
  if (percentage >= 70) colorClass = 'bg-green-500'
  else if (percentage < 50) colorClass = 'bg-orange-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8">{score.toFixed(1)}</span>
    </div>
  )
}

interface Invite {
  id: string
  email: string
  role: string
  code: string
  is_valid: boolean
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const isDesktop = useIsLarge() // 1024px breakpoint
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [currentOrgName, setCurrentOrgName] = useState<string>('')

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null)

  // Expanded athlete rows
  const [expandedAthletes, setExpandedAthletes] = useState<Set<string>>(new Set())

  // Coaching tips panel (desktop)
  const [tipsPanelOpen, setTipsPanelOpen] = useState(false)
  const [selectedAthleteForTips, setSelectedAthleteForTips] = useState<Athlete | null>(null)

  // Inline coaching tips expansion (mobile)
  const [inlineTipsExpanded, setInlineTipsExpanded] = useState<Set<string>>(new Set())

  const handleViewTips = (athlete: Athlete) => {
    if (isDesktop) {
      // Desktop: open side panel
      setSelectedAthleteForTips(athlete)
      setTipsPanelOpen(true)
    } else {
      // Mobile: toggle inline expansion
      toggleInlineTips(athlete.id)
    }
  }

  const handleCloseTipsPanel = () => {
    setTipsPanelOpen(false)
  }

  const toggleInlineTips = (athleteId: string) => {
    setInlineTipsExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(athleteId)) {
        next.delete(athleteId)
      } else {
        next.add(athleteId)
      }
      return next
    })
  }

  const toggleExpanded = (athleteId: string) => {
    setExpandedAthletes((prev) => {
      const next = new Set(prev)
      if (next.has(athleteId)) {
        next.delete(athleteId)
      } else {
        next.add(athleteId)
      }
      return next
    })
  }

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        // Get user's memberships to find admin org
        const fullUser = await apiGet<any>('/users/me/full')
        const adminMembership = fullUser.memberships?.find(
          (m: any) => m.role === 'admin'
        )

        if (adminMembership) {
          setCurrentOrgId(adminMembership.organization_id)

          // Get org details
          const org = await apiGet<any>(`/organizations/${adminMembership.organization_id}`)
          setCurrentOrgName(org.name)

          // Get invites for this org
          const orgInvites = await apiGet<Invite[]>(
            `/invites/organization/${adminMembership.organization_id}`
          )
          setInvites(orgInvites.filter((i) => i.is_valid))

          // Get athletes for this org
          const orgAthletes = await apiGet<Athlete[]>(
            `/organizations/${adminMembership.organization_id}/athletes`
          )
          setAthletes(orgAthletes)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (!isLoading && user) {
      loadUserData()
    }
  }, [user, isLoading])

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrgId) return

    setIsCreatingInvite(true)
    try {
      const invite = await apiPost<Invite>('/invites', {
        email: inviteEmail,
        organization_id: currentOrgId,
        role: 'athlete',
      })
      setLastInviteCode(invite.code)
      setInvites([invite, ...invites])
      setInviteEmail('')
    } catch (err: any) {
      alert(err.data?.detail || 'Failed to create invite')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentOrgName}</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Invite Athletes Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invite Athletes</h2>
            <Button onClick={() => setShowInviteForm(!showInviteForm)}>
              {showInviteForm ? 'Cancel' : '+ Invite Athlete'}
            </Button>
          </div>

          {showInviteForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              {lastInviteCode ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2">Invite created!</p>
                    <p className="text-sm text-green-700 mb-2">
                      Share this link with the athlete:
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
                      onClick={() => {
                        setLastInviteCode(null)
                      }}
                    >
                      Invite Another
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite} className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="athlete@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isCreatingInvite || !inviteEmail}>
                    {isCreatingInvite ? 'Sending...' : 'Send Invite'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Pending Invites</h3>
              <ul className="divide-y divide-gray-200">
                {invites.map((invite) => (
                  <li key={invite.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{invite.email}</span>
                      <span className="ml-2 text-sm text-gray-500">({invite.role})</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Athletes List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Athletes</h2>
            <span className="text-sm text-gray-500">
              {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {athletes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>No athletes have joined yet.</p>
              <p className="text-sm mt-2">Invite athletes using the form above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Athlete
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thinking / Feeling / Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {athletes.map((athlete) => {
                    const isExpanded = expandedAthletes.has(athlete.id)
                    return (
                      <React.Fragment key={athlete.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {athlete.first_name} {athlete.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {athlete.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {athlete.joined_at
                              ? new Date(athlete.joined_at).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {athlete.meta_scores ? (
                              <div className="flex gap-1">
                                <MetaScoreBadge category="thinking" score={athlete.meta_scores.thinking || 0} />
                                <MetaScoreBadge category="feeling" score={athlete.meta_scores.feeling || 0} />
                                <MetaScoreBadge category="action" score={athlete.meta_scores.action || 0} />
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {athlete.has_completed_assessment ? (
                                <>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Completed
                                  </span>
                                  <button
                                    onClick={() => toggleExpanded(athlete.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <svg
                                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded scores row */}
                        {isExpanded && athlete.pillar_scores && (
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {CORE_PILLAR_KEYS.map((pillar) => {
                                  const score = athlete.pillar_scores?.[pillar] || 0
                                  const isStrength = athlete.strengths?.includes(pillar)
                                  const isGrowth = athlete.growth_areas?.includes(pillar)
                                  return (
                                    <div key={pillar} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <PillarTooltip
                                          pillar={pillar as PillarKey}
                                          className="text-sm font-medium text-gray-700"
                                        />
                                        {isStrength && (
                                          <span className="text-xs px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded">
                                            Strength
                                          </span>
                                        )}
                                        {isGrowth && (
                                          <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                                            Growth
                                          </span>
                                        )}
                                      </div>
                                      <ScoreBar score={score} />
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Supporting Dimensions */}
                              <div className="border-t border-gray-200 pt-4 mt-4">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                  Supporting Dimensions
                                </h4>
                                <SupportingDimensionsCard
                                  scores={athlete.pillar_scores}
                                  variant="inline"
                                />
                              </div>

                              {/* View Tips button - Desktop only */}
                              {isDesktop && (
                                <div className="pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => handleViewTips(athlete)}
                                    className="text-sm font-medium text-sage-700 underline underline-offset-2 hover:text-sage-800 transition-colors"
                                  >
                                    View Coaching Tips
                                  </button>
                                </div>
                              )}

                              {/* Inline coaching tips - Mobile only */}
                              {!isDesktop && (
                                <div className="mt-4 -mx-6 -mb-4">
                                  <CoachingTipsInline
                                    athlete={athlete}
                                    isExpanded={inlineTipsExpanded.has(athlete.id)}
                                    onToggle={() => toggleInlineTips(athlete.id)}
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Coaching Tips Panel */}
      <CoachingTipPanel
        isOpen={tipsPanelOpen}
        onClose={handleCloseTipsPanel}
        athlete={selectedAthleteForTips}
      />
    </div>
  )
}
