'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Phone,
  Mail,
  LogOut,
  User,
  GraduationCap,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ParentData {
  id: string
  name: string
  email: string
  phone: string
  connections: Array<{
    id: string
    relationship: string
    isActive: boolean
    student: {
      id: string
      name: string
      email: string
      phone: string
      classe: string
      lycee: string
      level: string
      groups: Array<{
        id: string
        name: string
        subject: string
        teacher: {
          id: string
          name: string
          email: string
        }
      }>
    }
  }>
}

interface StudentProgress {
  studentId: string
  totalSessions: number
  attendedSessions: number
  attendanceRate: number
  paymentStatus: {
    status: string
    amountDue: number
    nextPaymentDate: string
  }
  recentSessions: Array<{
    id: string
    date: string
    subject: string
    attended: boolean
    groupName: string
  }>
}

export default function ParentDashboardPage() {
  const router = useRouter()
  const [parentData, setParentData] = useState<ParentData | null>(null)
  const [studentsProgress, setStudentsProgress] = useState<Record<string, StudentProgress>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadParentData()
  }, [])

  const loadParentData = () => {
    try {
      const storedData = localStorage.getItem('parentData')
      if (storedData) {
        const data = JSON.parse(storedData)
        setParentData(data)
        // Load progress for each connected student
        data.connections.forEach((connection: any) => {
          if (connection.isActive) {
            loadStudentProgress(connection.student.id)
          }
        })
      } else {
        router.push('/parent/login')
      }
    } catch (err) {
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentProgress = async (studentId: string) => {
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockProgress: StudentProgress = {
        studentId,
        totalSessions: 16,
        attendedSessions: 14,
        attendanceRate: 87.5,
        paymentStatus: {
          status: 'A_JOUR',
          amountDue: 0,
          nextPaymentDate: '2024-02-01'
        },
        recentSessions: [
          {
            id: '1',
            date: '2024-01-15',
            subject: 'Mathématiques',
            attended: true,
            groupName: 'Terminale S'
          },
          {
            id: '2',
            date: '2024-01-12',
            subject: 'Physique',
            attended: true,
            groupName: 'Terminale S'
          },
          {
            id: '3',
            date: '2024-01-10',
            subject: 'Mathématiques',
            attended: false,
            groupName: 'Terminale S'
          }
        ]
      }
      
      setStudentsProgress(prev => ({
        ...prev,
        [studentId]: mockProgress
      }))
    } catch (err) {
      console.error('Error loading student progress:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('parentData')
    toast.success('Déconnexion réussie')
    router.push('/parent/login')
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'A_JOUR':
        return <Badge className="bg-green-100 text-green-800">À jour</Badge>
      case 'EN_ATTENTE':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'EN_RETARD':
        return <Badge className="bg-red-100 text-red-800">En retard</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>
    }
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !parentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error || 'Données non trouvées'}</p>
            <Button onClick={() => router.push('/parent/login')} className="w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeConnections = parentData.connections.filter(conn => conn.isActive)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Espace Parent</h1>
                  <p className="text-sm text-gray-600">Bienvenue, {parentData.name}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Parent Info */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations du compte</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{parentData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{parentData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {activeConnections.length} enfant(s) connecté(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Overview */}
        {activeConnections.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun enfant connecté. Demandez à votre enfant de générer un code famille pour vous connecter.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {activeConnections.map((connection) => {
              const student = connection.student
              const progress = studentsProgress[student.id]
              
              return (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Student Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <GraduationCap className="h-12 w-12" />
                        <div>
                          <h2 className="text-2xl font-bold">{student.name}</h2>
                          <p className="text-indigo-100">
                            {student.classe} • {student.lycee}
                          </p>
                          <p className="text-indigo-200 text-sm">
                            Relation: {connection.relationship}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-100 text-sm">Niveau</p>
                        <p className="text-xl font-semibold">{student.level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Student Stats */}
                  {progress && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Sessions totales</p>
                              <p className="text-2xl font-bold text-gray-900">{progress.totalSessions}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-indigo-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Présences</p>
                              <p className="text-2xl font-bold text-gray-900">{progress.attendedSessions}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Taux de présence</p>
                              <p className={`text-2xl font-bold ${getAttendanceColor(progress.attendanceRate)}`}>
                                {progress.attendanceRate.toFixed(1)}%
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Statut paiement</p>
                              <div className="mt-1">
                                {getPaymentStatusBadge(progress.paymentStatus.status)}
                              </div>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Groups */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Groupes inscrits</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.groups.map((group) => (
                          <div key={group.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{group.name}</h4>
                              <Badge variant="outline">{group.subject}</Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Professeur: {group.teacher.name}</p>
                              <p>Email: {group.teacher.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Sessions */}
                  {progress && progress.recentSessions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Sessions récentes</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {progress.recentSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {session.attended ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{session.subject}</p>
                                  <p className="text-sm text-gray-600">{session.groupName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-900">{formatDate(session.date)}</p>
                                <p className={`text-xs ${
                                  session.attended ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {session.attended ? 'Présent' : 'Absent'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}