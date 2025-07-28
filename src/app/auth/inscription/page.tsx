'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'

const subjects = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Français',
  'Anglais',
  'Arabe',
  'Histoire',
  'Géographie',
  'Philosophie',
  'Sciences naturelles',
  'Informatique',
  'Économie'
]

const levels = [
  'Primaire',
  'Collège',
  'Lycée',
  'Université',
  'Formation professionnelle'
]

export default function InscriptionPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    subjects: [] as string[],
    levels: [] as string[],
    location: '',
    experience: '',
    acceptTerms: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  
  const { signup } = useAuthStore()
  const router = useRouter()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'subjects' | 'levels', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (formData.subjects.length === 0) {
      setError('Veuillez sélectionner au moins une matière')
      return false
    }
    if (formData.levels.length === 0) {
      setError('Veuillez sélectionner au moins un niveau')
      return false
    }
    if (!formData.location) {
      setError('Veuillez indiquer votre localisation')
      return false
    }
    if (!formData.acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError('')
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateStep2()) return
    
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const success = signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        subjects: formData.subjects,
        levels: formData.levels,
        location: formData.location,
        experience: formData.experience
      })
      
      if (success) {
        setStep(3) // Success step
      } else {
        setError('Cette adresse email est déjà utilisée')
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Inscription réussie !
          </h1>
          <p className="text-gray-600 mb-8">
            Votre demande d'inscription a été soumise avec succès. Vous recevrez un email de confirmation une fois votre compte approuvé par notre équipe.
          </p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/auth/connexion')} className="btn-primary w-full">
              Se connecter
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to home */}
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">LP</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Créer un compte
              </CardTitle>
              <CardDescription className="text-gray-600">
                Rejoignez LessonPro et transformez votre enseignement
              </CardDescription>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-center mt-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 mx-2 ${
                  step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
                <span>Informations personnelles</span>
                <span>Profil professionnel</span>
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6"
                >
                  {error}
                </motion.div>
              )}
              
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        Prénom *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="pl-10 h-12"
                          placeholder="Votre prénom"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Nom *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="pl-10 h-12"
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 h-12"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Numéro de téléphone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10 h-12"
                        placeholder="+216 XX XXX XXX"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Mot de passe *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pl-10 pr-10 h-12"
                          placeholder="Mot de passe"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirmer le mot de passe *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="pl-10 pr-10 h-12"
                          placeholder="Confirmer"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full btn-primary h-12 text-lg">
                    Continuer
                  </Button>
                </form>
              )}
              
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Matières enseignées *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.map(subject => (
                          <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject)}
                              onChange={() => handleArrayChange('subjects', subject)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Niveaux enseignés *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {levels.map(level => (
                          <label key={level} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.levels.includes(level)}
                              onChange={() => handleArrayChange('levels', level)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Localisation *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="location"
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="pl-10 h-12"
                          placeholder="Ville, région"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="experience" className="text-sm font-medium text-gray-700">
                        Années d'expérience (optionnel)
                      </label>
                      <Input
                        id="experience"
                        type="text"
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="h-12"
                        placeholder="Ex: 5 ans"
                      />
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                        required
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                        J'accepte les{' '}
                        <Link href="/conditions" className="text-indigo-600 hover:text-indigo-700">
                          conditions d'utilisation
                        </Link>
                        {' '}et la{' '}
                        <Link href="/confidentialite" className="text-indigo-600 hover:text-indigo-700">
                          politique de confidentialité
                        </Link>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12"
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 btn-primary h-12 text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Création...
                        </div>
                      ) : (
                        'Créer mon compte'
                      )}
                    </Button>
                  </div>
                </form>
              )}
              
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Déjà un compte ?{' '}
                  <Link href="/auth/connexion" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}