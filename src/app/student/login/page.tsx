'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, GraduationCap, Mail, Lock, UserPlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store student data in localStorage for now (in production, use proper session management)
      localStorage.setItem('studentData', JSON.stringify(data.student))
      
      toast.success('Connexion réussie!')
      // Redirect to student dashboard
      router.push('/student/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinWithCode = () => {
    if (!invitationCode.trim()) {
      setError('Veuillez entrer un code d\'invitation')
      return
    }
    
    // Redirect to join page with the invitation code
    router.push(`/student/join/${invitationCode.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portail Étudiant</h1>
          <p className="text-gray-600">Accédez à vos cours et devoirs</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous avec vos identifiants étudiants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 font-medium">
              Ou
            </span>
          </div>
        </div>

        {/* Join with Invitation Code Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-purple-600 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-lg">Nouveau sur la plateforme ?</CardTitle>
            <CardDescription>
              Rejoignez un groupe avec le code d'invitation de votre professeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitationCode">Code d'invitation</Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Entrez le code à 6 chiffres"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
              </div>
              
              <Button 
                onClick={handleJoinWithCode}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Rejoindre avec le code
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Le code d'invitation vous a été fourni par votre professeur
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Problème de connexion ?
          </p>
          <p className="text-sm text-gray-500">
            Contactez votre professeur pour obtenir vos identifiants
          </p>
          <div className="pt-4">
            <Link 
              href="/auth/signin" 
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Connexion Professeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}