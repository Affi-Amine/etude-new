'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, Users, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface GroupInfo {
  id: string
  name: string
  subject: string
  scheduleDay?: string
  scheduleTime?: string
}

interface TeacherInfo {
  name: string
  email: string
}

interface InvitationInfo {
  group: GroupInfo
  teacher: TeacherInfo
  usesRemaining: number
  expiresAt: string
}

interface StudentJoinPageProps {
  params: {
    code: string
  }
}

export default function StudentJoinPage({ params }: StudentJoinPageProps) {
  const router = useRouter()
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    classe: '',
    lycee: '',
    level: ''
  })

  useEffect(() => {
    validateInvitation()
  }, [params.code])

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/student/register?code=${params.code}`)
      const data = await response.json()

      if (data.success) {
        setInvitationInfo(data.invitation)
      } else {
        setError(data.error || 'Invalid invitation code')
      }
    } catch (err) {
      setError('Failed to validate invitation code')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRegistering(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setRegistering(false)
      return
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.classe || !formData.lycee) {
      setError('Veuillez remplir tous les champs obligatoires')
      setRegistering(false)
      return
    }

    // Validate phone number length
    if (formData.phone.length < 8) {
      setError('Le numéro de téléphone doit contenir au moins 8 chiffres')
      setRegistering(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setRegistering(false)
      return
    }

    try {
      const response = await fetch('/api/student/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationCode: params.code,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          classe: formData.classe,
          lycee: formData.lycee,
          level: formData.level,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Redirect to student login after 3 seconds
        setTimeout(() => {
          router.push('/student/login')
        }, 3000)
      } else {
        // Handle specific validation errors
        if (data.details && Array.isArray(data.details)) {
          const phoneError = data.details.find((detail: any) => detail.path?.includes('phone'))
          if (phoneError) {
            setError('Le numéro de téléphone doit contenir entre 8 et 15 chiffres')
          } else {
            setError(data.error || 'Données invalides. Veuillez vérifier vos informations.')
          }
        } else {
          setError(data.error || 'Erreur lors de l\'inscription')
        }
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Validation du code d'invitation...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Code d'invitation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Inscription réussie !</CardTitle>
            <CardDescription>
              Vous avez été inscrit avec succès au groupe {invitationInfo?.group.name}.
              Redirection vers la page de connexion...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Rejoindre le groupe
          </CardTitle>
          <CardDescription>
            Vous avez été invité à rejoindre un groupe d'étude
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Group Information */}
          {invitationInfo && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Informations du groupe</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span><strong>{invitationInfo.group.name}</strong> - {invitationInfo.group.subject}</span>
                </div>
                {invitationInfo.group.scheduleDay && invitationInfo.group.scheduleTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span>{invitationInfo.group.scheduleDay} à {invitationInfo.group.scheduleTime}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <span>Professeur: {invitationInfo.teacher.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="28108923 (8-15 chiffres)"
                  minLength={8}
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">Entre 8 et 15 chiffres</p>
              </div>
              <div>
                <Label htmlFor="level">Niveau (optionnel)</Label>
                <Input
                  id="level"
                  name="level"
                  type="text"
                  value={formData.level}
                  onChange={handleInputChange}
                  placeholder="Terminale, 1ère, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classe">Classe *</Label>
                <Input
                  id="classe"
                  name="classe"
                  type="text"
                  value={formData.classe}
                  onChange={handleInputChange}
                  required
                  placeholder="TS1, 1S2, etc."
                />
              </div>
              <div>
                <Label htmlFor="lycee">Lycée *</Label>
                <Input
                  id="lycee"
                  name="lycee"
                  type="text"
                  value={formData.lycee}
                  onChange={handleInputChange}
                  required
                  placeholder="Nom de votre lycée"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Répétez votre mot de passe"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={registering}
            >
              {registering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire au groupe'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Déjà inscrit ? <Link href="/student/login" className="text-blue-600 hover:underline">Se connecter</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}