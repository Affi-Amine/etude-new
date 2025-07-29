'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MapPin,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  DollarSign,
  UserCheck,
  AlertCircle,
  CreditCard,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
// Removed swr import as it's not used
// Removed client-side payment calculation - now handled by API
import { 
  formatCurrency, 
  formatDate, 
  formatTime,
  getPaymentStatusText,
  getPaymentStatusColor,
  isToday,
  getGroupAttendanceRate,
  formatWeeklySchedule,
  getFirstScheduleTime
} from '@/lib/utils'

// Quick actions remain the same but updated href paths

const quickActions = [
  {
    title: 'Nouveau groupe',
    description: 'Créer un nouveau groupe d\'étudiants',
    icon: Plus,
    href: '/dashboard/groupes?action=nouveau',
    color: 'bg-indigo-600'
  },
  {
    title: 'Ajouter étudiant',
    description: 'Inscrire un nouvel étudiant',
    icon: Users,
    href: '/dashboard/etudiants?action=nouveau',
    color: 'bg-green-600'
  },
  {
    title: 'Planifier session',
    description: 'Organiser une nouvelle session',
    icon: Calendar,
    href: '/dashboard/calendrier?action=nouveau',
    color: 'bg-purple-600'
  }
]

interface DashboardData {
  totalStudents: number
  totalGroups: number
  totalEarningsThisMonth: number
  studentsNeedingPayment: number
  upcomingSessions: number
  averageAttendanceRate: number
  studentsWithPaymentStatus: any[]
  upcomingSessionsList: any[]
  recentSessions: any[]
  students: any[]
  groups: any[]
  sessions: any[]
  paymentRecords: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const [error, setError] = useState<any>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          // Clear dashboard data when authentication fails or other errors occur
          setDashboardData(null);
          throw new Error('Failed to fetch dashboard data');
        }
        
        const result = await response.json();
        setDashboardData(result);
      } catch (err) {
        // Ensure dashboard data is cleared on any error
        setDashboardData(null);
        setError(err);
      }
    };
    fetchData();
  }, []);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (error) return <div>Failed to load dashboard data.</div>;

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-8">Veuillez vous connecter pour accéder au tableau de bord.</p>
          <Link href="/auth/connexion" className="text-indigo-600 hover:text-indigo-700">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const user = session?.user

  // Calculate month-over-month changes
  const calculateMonthlyChange = (current: number, previous: number): { change: string, type: 'increase' | 'decrease' | 'neutral' } => {
    if (previous === 0) return { change: current > 0 ? '+100%' : '0%', type: current > 0 ? 'increase' : 'neutral' }
    const percentage = ((current - previous) / previous) * 100
    const sign = percentage >= 0 ? '+' : ''
    return {
      change: `${sign}${Math.round(percentage)}%`,
      type: percentage > 0 ? 'increase' : percentage < 0 ? 'decrease' : 'neutral'
    }
  }

  // Get current month data
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  // Calculate previous month stats for comparison
  const previousMonthStudents = dashboardData.students?.filter(s => {
    const createdDate = new Date(s.createdAt)
    return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear
  }).length || 0

  const previousMonthGroups = dashboardData.groups?.filter(g => {
    const createdDate = new Date(g.createdAt)
    return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear
  }).length || 0

  // Calculate previous month earnings from sessions
  const previousMonthSessionsForEarnings = dashboardData.sessions?.filter(s => {
    const sessionDate = new Date(s.date)
    return sessionDate.getMonth() === lastMonth && sessionDate.getFullYear() === lastMonthYear
  }) || []
  
  const previousMonthEarnings = previousMonthSessionsForEarnings.reduce((total: number, session: any) => {
    const group = dashboardData.groups?.find((g: any) => g.id === session.groupId)
    if (!group) return total
    const attendeeCount = session.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0
    const pricePerStudent = group.sessionFee || (group.monthlyFee ? group.monthlyFee / 4 : 0)
    return total + (attendeeCount * (pricePerStudent || 0))
  }, 0)

  // Calculate attendance rate for previous month
  const previousMonthSessions = dashboardData.sessions?.filter(s => {
    const sessionDate = new Date(s.date)
    return sessionDate.getMonth() === lastMonth && sessionDate.getFullYear() === lastMonthYear
  }) || []

  const previousMonthAttendanceRate = previousMonthSessions.length > 0 
    ? Math.round(
        previousMonthSessions.reduce((sum, session) => {
          const attendanceCount = session.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0
          const totalStudents = session.attendance?.length || 1
          return sum + (attendanceCount / totalStudents) * 100
        }, 0) / previousMonthSessions.length
      )
    : 0

  // Calculate changes
  const studentsChange = calculateMonthlyChange(dashboardData.totalStudents, dashboardData.totalStudents - previousMonthStudents)
  const groupsChange = calculateMonthlyChange(dashboardData.totalGroups, dashboardData.totalGroups - previousMonthGroups)
  const earningsChange = calculateMonthlyChange(dashboardData.totalEarningsThisMonth, previousMonthEarnings)
  const attendanceChange = calculateMonthlyChange(dashboardData.averageAttendanceRate, previousMonthAttendanceRate)

  // Create dynamic stats based on real data
  const stats = [
    {
      name: 'Total Étudiants',
      value: dashboardData.totalStudents.toString(),
      change: studentsChange.change,
      changeType: studentsChange.type,
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Groupes Actifs',
      value: dashboardData.totalGroups.toString(),
      change: groupsChange.change,
      changeType: groupsChange.type,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Revenus ce mois',
      value: Math.round(dashboardData.totalEarningsThisMonth).toString(),
      change: earningsChange.change,
      changeType: earningsChange.type,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Taux de présence',
      value: `${dashboardData.averageAttendanceRate}%`,
      change: attendanceChange.change,
      changeType: attendanceChange.type,
      icon: UserCheck,
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bonjour, {user?.name || 'Professeur'} ! 👋
                </h1>
                <p className="text-indigo-100 text-lg mb-4">
                  Vous avez {dashboardData.upcomingSessions} sessions à venir et {dashboardData.studentsNeedingPayment} étudiants en attente de paiement.
                </p>
                {dashboardData.studentsNeedingPayment > 0 && (
                  <div className="flex items-center bg-white/10 rounded-lg px-4 py-2 w-fit">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {dashboardData.studentsNeedingPayment} paiement(s) en attente
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 + index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.name.includes('Revenus') ? formatCurrency(parseInt(stat.value)) : stat.value}
                        </p>
                        <div className="flex items-center mt-2">
                          {stat.changeType === 'increase' && (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                            </>
                          )}
                          {stat.changeType === 'decrease' && (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-600 font-medium">{stat.change}</span>
                            </>
                          )}
                          {stat.changeType === 'neutral' && (
                            <>
                              <Minus className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-sm text-gray-600 font-medium">{stat.change}</span>
                            </>
                          )}
                          <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Payment Alerts */}
        {dashboardData.studentsNeedingPayment > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-8"
          >
            <Card className="border-l-4 border-l-orange-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Paiements en attente
                </CardTitle>
                <CardDescription>
                  {dashboardData.studentsNeedingPayment} étudiant(s) ont des paiements en attente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.studentsWithPaymentStatus
                    .filter(s => s.paymentStatus && ['pending', 'overdue', 'overflow'].includes(s.paymentStatus.status))
                    .slice(0, 3)
                    .map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-orange-700 font-medium text-sm">
                              {student.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.group?.name || 'Aucun groupe'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getPaymentStatusColor(student.paymentStatus?.status || 'pending')}>
                            {getPaymentStatusText(student.paymentStatus?.status || 'pending')}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                              {formatCurrency(student.paymentStatus?.amount || 0)}
                            </p>
                        </div>
                      </div>
                    ))}
                  {dashboardData.studentsNeedingPayment > 3 && (
                    <div className="text-center pt-2">
                      <Link href="/dashboard/etudiants">
                        <Button variant="outline" size="sm">
                          Voir tous les paiements
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Actions rapides
              </CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={action.title} href={action.href}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                        className="p-4 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer group"
                      >
                        <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Sessions & Groups Overview */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Today's Sessions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Sessions d'aujourd'hui
                  </div>
                  <Link href="/dashboard/calendrier">
                    <Button variant="ghost" size="sm">
                      Voir tout
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.upcomingSessionsList.filter(session => isToday(new Date(session.date))).length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.upcomingSessionsList
                      .filter(session => isToday(new Date(session.date)))
                      .map((session) => {
                        return (
                          <div key={session.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{session.group?.name}</p>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                {session.group?.schedule?.time || 'N/A'}
                                <Users className="h-4 w-4 ml-3 mr-1" />
                                {session.attendances?.length || 0} étudiants
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.status.toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                session.status.toUpperCase() === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status.toUpperCase() === 'COMPLETED' ? 'Terminé' :
                                 session.status.toUpperCase() === 'SCHEDULED' ? 'Programmé' : 'Annulé'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune session prévue aujourd'hui</p>
                    <Link href="/dashboard/calendrier?action=nouveau">
                      <Button className="mt-4" variant="outline">
                        Planifier une session
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Groups Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Mes Groupes
                  </div>
                  <Link href="/dashboard/groupes">
                    <Button variant="ghost" size="sm">
                      Voir tout
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.groups?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.groups.slice(0, 3).map((group: any) => {
                      const groupSessions = group.sessions || []
                      const attendanceRate = getGroupAttendanceRate(groupSessions, group.id)
                      return (
                        <div key={group.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">
                              {group.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {group.name}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Users className="h-4 w-4 mr-1" />
                              {group.students?.length || 0} étudiants
                              <Clock className="h-4 w-4 ml-3 mr-1" />
                              {formatWeeklySchedule(group.weeklySchedule)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {attendanceRate}% présence
                            </p>
                            <p className="text-xs text-gray-500">
                              {group.paymentThreshold || 4} sessions/mois
                            </p>
                            <p className="text-xs font-medium text-blue-600">
                              {formatCurrency((group.sessionFee || 0) * (group.paymentThreshold || 4))}/mois
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun groupe créé</p>
                    <Link href="/dashboard/groupes?action=nouveau">
                      <Button className="mt-4" variant="outline">
                        Créer un groupe
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Sessions à venir
                </div>
                <Link href="/dashboard/calendrier">
                  <Button variant="ghost" size="sm">
                    Voir calendrier
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingSessionsList.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcomingSessionsList.map((session) => {
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">{session.group?.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(new Date(session.date))} • {getFirstScheduleTime(session.group?.weeklySchedule) || formatTime(session.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{formatTime(session.date)}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.status.toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            session.status.toUpperCase() === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status.toUpperCase() === 'COMPLETED' ? 'Terminé' :
                             session.status.toUpperCase() === 'SCHEDULED' ? 'Programmé' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune session prévue</p>
                  <Link href="/dashboard/calendrier?action=nouveau">
                    <Button className="mt-4" variant="outline">
                      Planifier des sessions
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}