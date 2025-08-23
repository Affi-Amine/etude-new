'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FamilyCodeModal } from '@/components/modals/family-code-modal'
import { 
  Calendar, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  ExternalLink,
  LogOut,
  User,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  History,
  CalendarDays,
  Users,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface StudentData {
  id: string
  name: string
  email: string
  phone: string
  classe?: string
  lycee: string
  niveau: string
  section: string
  groups: Array<{
    group: {
      id: string
      name: string
      subject: string
      scheduleDay: string
      scheduleTime: string
    }
  }>
}

interface Session {
  id: string
  date: string
  duration: number
  status: string
  title?: string
  description?: string
  objectives?: string[]
  materials?: string[]
  homework?: string
  resources?: any
  group: {
    id: string
    name: string
    subject: string
  }
  attendance: {
    status: string
    notes?: string
  } | null
}

interface ProgressData {
  overallStats: {
    totalSessions: number
    attendedSessions: number
    attendanceRate: number
  }
  groupProgress: Array<{
    group: {
      id: string
      name: string
      subject: string
    }
    stats: {
      totalSessions: number
      attendedSessions: number
      attendanceRate: number
    }
  }>
  upcomingSessions: Array<{
    id: string
    date: string
    duration: number
    title?: string
    group: {
      name: string
      subject: string
    }
  }>
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPastSessions, setShowPastSessions] = useState(false)
  const [familyCode, setFamilyCode] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedData = localStorage.getItem('studentData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setStudentData(data)
      fetchStudentData(data.id)
    } else {
      router.push('/student/login')
    }
  }, [])

  const fetchStudentData = async (studentId: string) => {
    try {
      setLoading(true)
      
      // Fetch sessions
      const sessionsResponse = await fetch(`/api/student/sessions?studentId=${studentId}`)
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions || [])
        console.log('✅ Sessions loaded:', sessionsData.sessions?.length || 0)
      } else {
        const errorData = await sessionsResponse.json()
        console.error('❌ Sessions API error:', errorData)
      }
      
      // Fetch progress data
      const progressResponse = await fetch(`/api/student/progress?studentId=${studentId}`)
      if (progressResponse.ok) {
        const progressDataResult = await progressResponse.json()
        setProgressData(progressDataResult)
        console.log('✅ Progress loaded:', progressDataResult)
      } else {
        const errorData = await progressResponse.json()
        console.error('❌ Progress API error:', errorData)
      }
      
    } catch (err) {
      console.error('💥 Fetch error:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('studentData')
    router.push('/student/login')
  }

  const generateFamilyCode = async () => {
    if (!studentData) return
    
    try {
      setGeneratingCode(true)
      const response = await fetch('/api/student/family-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentData.id }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setFamilyCode(data.familyCode)
      } else {
        setError('Erreur lors de la génération du code famille')
      }
    } catch (err) {
      console.error('Error generating family code:', err)
      setError('Erreur lors de la génération du code famille')
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const fetchFamilyCode = async () => {
    if (!studentData) return
    
    try {
      const response = await fetch(`/api/student/family-code?studentId=${studentData.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.familyCode) {
          setFamilyCode(data.familyCode)
        }
      }
    } catch (err) {
      console.error('Error fetching family code:', err)
    }
  }

  useEffect(() => {
    if (studentData) {
      fetchFamilyCode()
    }
  }, [studentData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Présent</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>
      case 'LATE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Retard</Badge>
      default:
        return <Badge variant="outline">Non marqué</Badge>
    }
  }

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>
      case 'SCHEDULED':
        return <Badge variant="secondary">Programmé</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Annulé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get current time in Tunisia timezone
  const getCurrentTunisiaTime = () => {
    return new Date().toLocaleString('en-US', { timeZone: 'Africa/Tunis' })
  }

  // Separate sessions into past and upcoming
  const separateSessions = () => {
    const now = new Date(getCurrentTunisiaTime())
    const pastSessions = sessions
      .filter(session => new Date(session.date) < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4) // Only last 4 past sessions
    
    const upcomingSessions = sessions
      .filter(session => new Date(session.date) >= now && session.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return { pastSessions, upcomingSessions }
  }

  const { pastSessions, upcomingSessions } = separateSessions()

  const renderSessionCard = (session: Session) => (
    <div key={session.id} className="group bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {session.title || `${session.group.subject} - ${session.group.name}`}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                {session.group.name}
              </Badge>
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                {session.duration} min
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <p className="text-sm">{formatDate(session.date)}</p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {getSessionStatusBadge(session.status)}
            {session.attendance && getStatusBadge(session.attendance.status)}
          </div>
        </div>
        
        {session.description && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-700 leading-relaxed">{session.description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {session.objectives && session.objectives.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <div className="bg-blue-200 p-1 rounded-lg mr-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                Objectifs
              </h4>
              <ul className="space-y-2">
                {session.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {session.materials && session.materials.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                <div className="bg-indigo-200 p-1 rounded-lg mr-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                </div>
                Matériel
              </h4>
              <div className="flex flex-wrap gap-2">
                {session.materials.map((material, index) => (
                  <Badge key={index} className="bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200 transition-colors">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {session.resources && session.resources.files && session.resources.files.length > 0 && (
          <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
              <div className="bg-emerald-200 p-1 rounded-lg mr-2">
                <Download className="h-4 w-4 text-emerald-600" />
              </div>
              Ressources
            </h4>
            <div className="flex flex-wrap gap-2">
              {session.resources.files.map((file: any, index: number) => (
                <Button key={index} variant="outline" size="sm" asChild className="bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700">
                  <a href={`/api/sessions/${session.id}/content/attachments/${file.filename}`} target="_blank">
                    <Download className="h-3 w-3 mr-1" />
                    {file.originalName}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Portail Étudiant
                </h1>
                <p className="text-slate-600 mt-1 font-medium">
                  Bienvenue, {studentData?.name || 'Étudiant'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Student Info Card */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl">Informations Personnelles</span>
                <p className="text-slate-100 text-sm font-normal mt-1">Profil étudiant</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Niveau</p>
                    <p className="text-lg font-bold text-slate-800">{studentData.niveau} {studentData.section}</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 hover:shadow-lg transition-all duration-200">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-md">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Lycée</p>
                    <p className="text-lg font-bold text-slate-800">{studentData.lycee}</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-all duration-200">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Email</p>
                    <p className="text-lg font-bold text-slate-800 truncate">{studentData.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        {progressData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressData.overallStats.totalSessions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Assistées</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{progressData.overallStats.attendedSessions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{progressData.overallStats.attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Tabs with Vertical Layout */}
        <div className="flex gap-8">
          <Tabs defaultValue="sessions" className="flex-1">
            <div className="flex gap-8">
              <TabsList className="flex flex-col h-fit w-64 bg-white/80 backdrop-blur-sm border border-slate-200 p-3 rounded-2xl shadow-lg space-y-2">
                <TabsTrigger 
                  value="sessions" 
                  className="w-full justify-start flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 py-4 px-4 font-medium"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Mes Sessions</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="homework" 
                  className="w-full justify-start flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 py-4 px-4 font-medium"
                >
                  <FileText className="h-5 w-5" />
                  <span>Devoirs</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="progress" 
                  className="w-full justify-start flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 py-4 px-4 font-medium"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Progression</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="family" 
                  className="w-full justify-start flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-200 py-4 px-4 font-medium"
                >
                  <Users className="h-5 w-5" />
                  <span>Code Famille</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1">
                {/* Enhanced Sessions Tab */}
                <TabsContent value="sessions">
                  <div className="space-y-6">
                    {/* Upcoming Sessions */}
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center space-x-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <CalendarDays className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-xl font-semibold">Prochaine Session</span>
                            <p className="text-green-100 text-sm font-normal mt-1">Votre session à venir</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        {upcomingSessions.length > 0 ? (
                          <div className="space-y-4">
                            {renderSessionCard(upcomingSessions[0])}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-12 border border-green-200">
                              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CalendarDays className="h-10 w-10 text-green-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucune session programmée</h3>
                              <p className="text-slate-600 text-lg mb-4">Votre prochaine session apparaîtra ici une fois planifiée</p>
                              <p className="text-sm text-green-600 font-medium">📅 Astuce : Contactez votre professeur pour programmer de nouvelles sessions</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Past Sessions */}
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <History className="h-6 w-6" />
                            </div>
                            <div>
                              <span className="text-xl font-semibold">Sessions Passées</span>
                              <p className="text-blue-100 text-sm font-normal mt-1">Les 4 dernières sessions</p>
                            </div>
                          </div>
                          {pastSessions.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPastSessions(!showPastSessions)}
                              className="text-white hover:bg-white/20"
                            >
                              {showPastSessions ? (
                                <><ChevronUp className="h-4 w-4 mr-2" />Masquer</>
                              ) : (
                                <><ChevronDown className="h-4 w-4 mr-2" />Afficher</>
                              )}
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        {pastSessions.length > 0 ? (
                          showPastSessions ? (
                            <div className="space-y-4">
                              {pastSessions.map((session) => renderSessionCard(session))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-slate-600">Cliquez sur "Afficher" pour voir vos {pastSessions.length} dernières sessions</p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-12 border border-blue-200">
                              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <History className="h-10 w-10 text-blue-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucune session passée</h3>
                              <p className="text-slate-600 text-lg mb-4">Vos sessions passées apparaîtront ici</p>
                              <p className="text-sm text-blue-600 font-medium">📚 Astuce : Votre historique se construira au fur et à mesure</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Enhanced Homework Tab - Simplified */}
                <TabsContent value="homework">
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-xl font-semibold">Devoirs Récents</span>
                          <p className="text-purple-100 text-sm font-normal mt-1">Vos derniers devoirs assignés</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {sessions
                          .filter(session => session.homework && session.homework.trim() !== '')
                          .slice(0, 3) // Limit to 3 most recent homework
                          .map((session) => (
                            <div key={session.id} className="group bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-slate-800 mb-2">{session.group.subject} - {session.group.name}</h3>
                                  <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="h-4 w-4" />
                                    <p className="text-sm">Session du {formatDate(session.date)}</p>
                                  </div>
                                </div>
                                {getSessionStatusBadge(session.status)}
                              </div>
                              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="bg-amber-200 p-2 rounded-lg">
                                    <FileText className="h-5 w-5 text-amber-700" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-800 mb-2">Devoir à rendre:</p>
                                    <p className="text-amber-700 leading-relaxed">{session.homework}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {sessions.filter(s => s.homework && s.homework.trim() !== '').length === 0 && (
                          <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-12 border border-purple-200">
                              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-10 w-10 text-purple-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-3">Aucun devoir en cours</h3>
                              <p className="text-slate-600 text-lg mb-4">Vos devoirs et exercices apparaîtront ici une fois assignés.</p>
                              <p className="text-sm text-purple-600 font-medium">📚 Astuce : Consultez régulièrement cette section pour ne rien manquer</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Enhanced Progress Tab - Simplified */}
                <TabsContent value="progress">
                  {progressData && (
                    <div className="space-y-6">
                      {/* Group Progress - Simplified */}
                      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg">
                          <CardTitle className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                              <span className="text-xl font-semibold">Résumé de Performance</span>
                              <p className="text-green-100 text-sm font-normal mt-1">Votre progression globale</p>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {progressData.groupProgress.slice(0, 2).map((groupData) => (
                              <div key={groupData.group.id} className="group bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-lg font-bold text-slate-800">{groupData.group.subject}</h3>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                                    {groupData.stats.attendanceRate}%
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Sessions totales</span>
                                    <span className="font-semibold text-slate-800">{groupData.stats.totalSessions}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Sessions assistées</span>
                                    <span className="font-semibold text-green-600">{groupData.stats.attendedSessions}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Family Code Tab */}
                <TabsContent value="family">
                  <div className="space-y-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center space-x-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <Users className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-xl font-semibold">Code Famille</span>
                            <p className="text-orange-100 text-sm font-normal mt-1">Invitez votre famille à suivre votre progression</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          <div className="text-center">
                            <p className="text-slate-600 mb-6">
                              Générez un code unique pour permettre à votre famille de suivre votre progression académique.
                            </p>
                          </div>
                          
                          {familyCode ? (
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                              <div className="text-center space-y-4">
                                <h3 className="text-lg font-semibold text-orange-800">Votre Code Famille</h3>
                                <div className="bg-white border-2 border-orange-300 rounded-lg p-4 font-mono text-2xl font-bold text-orange-700 tracking-wider">
                                  {familyCode}
                                </div>
                                <div className="flex justify-center space-x-3">
                                <Button
                                  onClick={() => copyToClipboard(familyCode)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copier le Code
                                </Button>
                                <Button
                                  onClick={generateFamilyCode}
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  disabled={generatingCode}
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${generatingCode ? 'animate-spin' : ''}`} />
                                  Nouveau Code
                                </Button>
                                <Button
                                  onClick={() => setShowFamilyModal(true)}
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Gérer
                                </Button>
                              </div>
                                <p className="text-sm text-orange-600">
                                  Partagez ce code avec votre famille pour qu'ils puissent suivre votre progression.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
                                <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun Code Généré</h3>
                                <p className="text-slate-500 mb-6">
                                  Cliquez sur le bouton ci-dessous pour générer votre premier code famille.
                                </p>
                                <div className="flex justify-center space-x-3">
                                  <Button
                                    onClick={generateFamilyCode}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    disabled={generatingCode}
                                  >
                                    {generatingCode ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Users className="h-4 w-4 mr-2" />
                                    )}
                                    Générer Code Famille
                                  </Button>
                                  <Button
                                    onClick={() => setShowFamilyModal(true)}
                                    variant="outline"
                                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Gérer Accès
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              Comment ça marche ?
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-700">
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>Générez un code unique pour votre famille</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>Partagez ce code avec vos parents ou tuteurs</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>Ils pourront suivre votre progression et vos résultats</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>Vous pouvez générer un nouveau code à tout moment</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Family Code Management Modal */}
      <FamilyCodeModal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        studentId={studentData?.id || ''}
        currentFamilyCode={familyCode}
        onCodeUpdate={(newCode) => setFamilyCode(newCode)}
      />
    </div>
  )
}