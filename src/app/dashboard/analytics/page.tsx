'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Award,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDataStore } from '@/store/data'
import { formatCurrency } from '@/lib/utils'

const timeRanges = [
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: '3 derniers mois', value: '3m' },
  { label: '6 derniers mois', value: '6m' },
  { label: 'Cette année', value: '1y' }
]

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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  
  const { students, groups, lessons } = useDataStore()

  // Calculate analytics data
  const getAnalyticsData = () => {
    const completedLessons = lessons.filter(lesson => lesson.status === 'completed')
    const totalRevenue = completedLessons.reduce((total, lesson) => {
      const group = groups.find(g => g.id === lesson.groupId)
      return total + (group?.pricePerSession || 0)
    }, 0)
    
    const activeStudents = students.filter(student => {
      const studentGroups = groups.filter(group => group.studentIds.includes(student.id))
      return studentGroups.length > 0
    }).length
    
    const averageAttendance = lessons.length > 0 ? 
      lessons.reduce((total, lesson) => {
        if (!lesson.attendance || lesson.attendance.length === 0) return total
        const present = lesson.attendance.filter(att => att.present).length
        const rate = (present / lesson.attendance.length) * 100
        return total + rate
      }, 0) / lessons.length : 0
    
    const subjectStats = subjects.map(subject => {
      const subjectGroups = groups.filter(group => group.subject === subject)
      const subjectLessons = lessons.filter(lesson => 
        subjectGroups.some(group => group.id === lesson.groupId)
      )
      const subjectRevenue = subjectLessons
        .filter(lesson => lesson.status === 'completed')
        .reduce((total, lesson) => {
          const group = groups.find(g => g.id === lesson.groupId)
          return total + (group?.pricePerSession || 0)
        }, 0)
      
      return {
        subject,
        groupCount: subjectGroups.length,
        lessonCount: subjectLessons.length,
        revenue: subjectRevenue,
        studentCount: subjectGroups.reduce((total, group) => total + group.studentIds.length, 0)
      }
    }).filter(stat => stat.groupCount > 0)
    
    return {
      totalRevenue,
      activeStudents,
      totalGroups: groups.length,
      completedLessons: completedLessons.length,
      averageAttendance,
      subjectStats
    }
  }

  const analytics = getAnalyticsData()

  // Mock data for charts (in a real app, this would come from your backend)
  const revenueData = [
    { month: 'Jan', revenue: 2400, lessons: 12 },
    { month: 'Fév', revenue: 1398, lessons: 8 },
    { month: 'Mar', revenue: 9800, lessons: 24 },
    { month: 'Avr', revenue: 3908, lessons: 18 },
    { month: 'Mai', revenue: 4800, lessons: 22 },
    { month: 'Jun', revenue: 3800, lessons: 16 }
  ]

  const attendanceData = [
    { day: 'Lun', rate: 95 },
    { day: 'Mar', rate: 88 },
    { day: 'Mer', rate: 92 },
    { day: 'Jeu', rate: 85 },
    { day: 'Ven', rate: 90 },
    { day: 'Sam', rate: 78 },
    { day: 'Dim', rate: 82 }
  ]

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathématiques': 'from-blue-500 to-cyan-500',
      'Physique': 'from-purple-500 to-pink-500',
      'Chimie': 'from-green-500 to-emerald-500',
      'Français': 'from-orange-500 to-red-500',
      'Anglais': 'bg-indigo-600',
      'Arabe': 'from-yellow-500 to-orange-500',
      'Histoire': 'from-gray-500 to-gray-600',
      'Géographie': 'from-teal-500 to-cyan-500',
      'Philosophie': 'from-violet-500 to-purple-500',
      'Sciences naturelles': 'from-lime-500 to-green-500',
      'Informatique': 'from-slate-500 to-gray-600',
      'Économie': 'from-emerald-500 to-teal-500'
    }
    return colors[subject as keyof typeof colors] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Analysez vos performances et suivez vos progrès</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+12.5%</span>
                    <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Étudiants Actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.activeStudents}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+8.2%</span>
                    <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cours Terminés</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.completedLessons}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+15.3%</span>
                    <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux Présence</p>
                  <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.averageAttendance)}%</p>
                  <div className="flex items-center mt-2">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 font-medium">-2.1%</span>
                    <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Évolution des Revenus
                </CardTitle>
                <CardDescription>
                  Revenus mensuels et nombre de cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-between space-x-2">
                  {revenueData.map((data, index) => (
                    <div key={data.month} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center space-y-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 200}px` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className="w-8 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg"
                        ></motion.div>
                        <span className="text-xs text-gray-600">{data.month}</span>
                        <span className="text-xs font-medium text-gray-900">{formatCurrency(data.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Taux de Présence Hebdomadaire
                </CardTitle>
                <CardDescription>
                  Présence par jour de la semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-between space-x-2">
                  {attendanceData.map((data, index) => (
                    <div key={data.day} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center space-y-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.rate / 100) * 200}px` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className={`w-8 rounded-t-lg ${
                            data.rate >= 90 ? 'bg-gradient-to-t from-green-500 to-emerald-500' :
                            data.rate >= 80 ? 'bg-gradient-to-t from-blue-500 to-cyan-500' :
                            data.rate >= 70 ? 'bg-gradient-to-t from-yellow-500 to-orange-500' :
                            'bg-gradient-to-t from-red-500 to-pink-500'
                          }`}
                        ></motion.div>
                        <span className="text-xs text-gray-600">{data.day}</span>
                        <span className="text-xs font-medium text-gray-900">{data.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subject Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Performance par Matière
              </CardTitle>
              <CardDescription>
                Statistiques détaillées par matière enseignée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.subjectStats.map((stat, index) => (
                  <motion.div
                    key={stat.subject}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{stat.subject}</h3>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSubjectColor(stat.subject)}`}></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Groupes:</span>
                        <span className="font-medium">{stat.groupCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Étudiants:</span>
                        <span className="font-medium">{stat.studentCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cours:</span>
                        <span className="font-medium">{stat.lessonCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenus:</span>
                        <span className="font-medium text-green-600">{formatCurrency(stat.revenue)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Performance</span>
                        <span>{Math.round((stat.revenue / analytics.totalRevenue) * 100)}% du total</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.revenue / analytics.totalRevenue) * 100}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                          className={`h-1.5 rounded-full bg-gradient-to-r ${getSubjectColor(stat.subject)}`}
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Objectifs du Mois
                </CardTitle>
                <CardDescription>
                  Suivez vos objectifs mensuels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenus: {formatCurrency(analytics.totalRevenue)} / {formatCurrency(15000)}</span>
                    <span className="font-medium">{Math.round((analytics.totalRevenue / 15000) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min((analytics.totalRevenue / 15000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nouveaux étudiants: {analytics.activeStudents} / 50</span>
                    <span className="font-medium">{Math.round((analytics.activeStudents / 50) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${Math.min((analytics.activeStudents / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux présence: {Math.round(analytics.averageAttendance)}% / 95%</span>
                    <span className="font-medium">{Math.round((analytics.averageAttendance / 95) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min((analytics.averageAttendance / 95) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Réalisations Récentes
                </CardTitle>
                <CardDescription>
                  Vos derniers succès et jalons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">100 cours terminés</p>
                    <p className="text-xs text-green-600">Félicitations pour ce jalon!</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">50 étudiants actifs</p>
                    <p className="text-xs text-blue-600">Votre communauté grandit!</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Taux présence {'>'}90%</p>
                    <p className="text-xs text-purple-600">Excellent engagement!</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-900">Objectif revenus atteint</p>
                    <p className="text-xs text-orange-600">Bravo pour vos performances!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
  )
}