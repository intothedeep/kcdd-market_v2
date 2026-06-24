/**
 * Create New Request Page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { routes } from '@/config'
import { createNewRequest, getOrganizationByUserId, fetchCauseAreas } from '@/lib/supabase'

interface CauseArea {
  id: string
  name: string
}

export function NewRequestPage() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [organization, setOrganization] = useState<{ id: string; zipcode: string } | null>(null)
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    cause_area_id: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    beneficiaries_count: '1',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        const [org, areas] = await Promise.all([
          getOrganizationByUserId(user.id),
          fetchCauseAreas(),
        ])

        if (org) {
          setOrganization({ id: org.id, zipcode: org.zipcode || '' })
        }
        setCauseAreas(areas)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organization) {
      setError('Organization not found. Please complete your profile first.')
      return
    }

    if (!form.description || !form.amount || !form.cause_area_id) {
      setError('Please fill in all required fields')
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createNewRequest({
        organization_id: organization.id,
        cause_area_id: form.cause_area_id,
        description: form.description,
        amount: amount,
        urgency: form.urgency,
        zipcode: organization.zipcode || '64101',
      })

      setSuccess(true)
      setTimeout(() => {
        navigate(routes.cbo.dashboard)
      }, 2000)
    } catch (err: any) {
      console.error('Error creating request:', err)
      setError(err.message || 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b5858]" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="py-8 text-center">
          <CardContent>
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold">Request Created!</h2>
            <p className="text-[#737373]">
              Your request has been submitted and is now visible to donors.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="mb-8 text-3xl font-bold">Create New Request</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Describe the technology or equipment your organization needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you need and how it will help your organization..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Needed *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cause_area">Cause Area *</Label>
                <select
                  id="cause_area"
                  value={form.cause_area_id}
                  onChange={(e) => setForm({ ...form, cause_area_id: e.target.value })}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                  required
                >
                  <option value="">Select a cause area...</option>
                  {causeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={form.urgency === level ? 'default' : 'outline'}
                    className={form.urgency === level ? 'bg-[#1b5858] hover:bg-[#164444]' : ''}
                    onClick={() => setForm({ ...form, urgency: level })}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-[#737373]">
                {form.urgency === 'high' && 'Urgent need - required within 1-2 weeks'}
                {form.urgency === 'medium' && 'Moderate need - required within 1-2 months'}
                {form.urgency === 'low' && 'Low urgency - flexible timeline'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiaries">People this will help</Label>
              <Input
                id="beneficiaries"
                type="number"
                min="1"
                value={form.beneficiaries_count}
                onChange={(e) => setForm({ ...form, beneficiaries_count: e.target.value })}
              />
              <p className="text-xs text-[#737373]">
                Estimated unique beneficiaries served when this request is fulfilled. Used in your
                impact analytics.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1b5858] hover:bg-[#164444]" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
