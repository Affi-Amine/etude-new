'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Play,
  Pause,
  User,
  TrendingUp,
  DollarSign,
  Grid3X3,
  List,
  CalendarDays,
  History,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGroups } from '@/hooks/useGroups'
import { useStudents } from '@/hooks/useStudents'
import { formatCurrency, formatDate, formatTime, getInitials, getFirstScheduleTime } from '@/lib/utils'
import CourseContentModal from '@/components/modals/course-content-modal'
import SessionHistoryModal from '@/components/modals/session-history-modal'

const statusConfig = {
  SCHEDULED: {
    label: 'Programmé',
    color: 'bg-blue-100 text-blue-800',
    icon: Calendar
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  POSTPONED: {
    label: 'Reporté',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  }
}

type FilterType = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'
type SortType = 'date' | 'subject' | 'status' | 'group'

export default function CoursPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)
  const [sessionsWithDetails, setSessionsWithDetails] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showContentModal, setShowContentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // API hooks
  const { groups, loading: groupsLoading } = useGroups()
  const { students, loading: studentsLoading } = useStudents()

  // Fetch all sessions from dedicated sessions API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions')
        if (!response.ok) {
          console.error('Failed to fetch sessions')
          return
        }
        
        const sessions = await response.json()
        
        // Enhance sessions with additional data
        const enhancedSessions = sessions.map((session: any) => ({
          ...session,
          students: students?.filter(s => 
            session.group?.students?.some((gs: any) => gs.studentId === s.id)
          ) || [],
          status: session.status || 'SCHEDULED',
          attendanceRate: session.attendance?.length > 0 ?
            (session.attendance.filter((a: any) => a.status === 'PRESENT').length / session.attendance.length) * 100 : 0
        }))
        
        setSessionsWithDetails(enhancedSessions)
        setMounted(true)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setSessionsWithDetails([])
        setMounted(true)
      }
    }

    if (students && groups) {
      fetchSessions()
    }
  }, [students, groups])

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    if (!mounted) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let filtered = sessionsWithDetails.filter(session => {
      // Search filter
      const matchesSearch = !searchTerm || 
        session.group?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.group?.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.notes && session.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Type filter
      const sessionDate = new Date(session.date)
      sessionDate.setHours(0, 0, 0, 0)
      
      const matchesType = (() => {
          switch (filterType) {
            case 'today': return sessionDate.getTime() === today.getTime()
            case 'upcoming': return sessionDate.getTime() > today.getTime() && session.status.toUpperCase() !== 'CANCELLED'
            case 'completed': return session.status.toUpperCase() === 'COMPLETED'
            case 'cancelled': return session.status.toUpperCase() === 'CANCELLED'
            default: return true
          }
        })()
      
      return matchesSearch && matchesType
    })

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'date':
          const dateA = new Date(`${a.date} ${a.startTime || '00:00'}`)
          const dateB = new Date(`${b.date} ${b.startTime || '00:00'}`)
          return dateB.getTime() - dateA.getTime()
        case 'subject':
          return (a.group?.subject || '').localeCompare(b.group?.subject || '')
        case 'status':
          return a.status.localeCompare(b.status)
        case 'group':
          return (a.group?.name || '').localeCompare(b.group?.name || '')
        default:
          return 0
      }
    })

    return filtered
  }, [sessionsWithDetails, searchTerm, filterType, sortType])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!mounted) return { total: 0, completed: 0, upcoming: 0, cancelled: 0, revenue: 0 }
    
    const total = sessionsWithDetails.length
    const completed = sessionsWithDetails.filter(s => s.status.toUpperCase() === 'COMPLETED').length
    const upcoming = sessionsWithDetails.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate > new Date() && s.status.toUpperCase() === 'SCHEDULED'
    }).length
    const cancelled = sessionsWithDetails.filter(s => s.status.toUpperCase() === 'CANCELLED').length
    const revenue = sessionsWithDetails
      .filter(s => s.status.toUpperCase() === 'COMPLETED')
      .reduce((total, session) => {
        const group = session.group
        if (!group?.paymentConfig) return total
        const attendeeCount = session.attendance?.filter((att: any) => att.status === 'PRESENT').length || 0
        const pricePerStudent = group.paymentConfig.sessionFee || (group.paymentConfig.monthlyFee || 0) / 4
        return total + (attendeeCount * pricePerStudent)
      }, 0)
    
    return { total, completed, upcoming, cancelled, revenue }
  }, [mounted, sessionsWithDetails])

  const getSubjectColor = (subject?: string) => {
    if (!subject) return 'from-gray-500 to-gray-600'
    
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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
            <p className="text-gray-600 mt-1">Gérez vos sessions et suivez les présences</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/dashboard/sessions/nouvelle">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle session
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessions Terminées</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessions à Venir</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher une session..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sessions</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="upcoming">À venir</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="cancelled">Annulées</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="subject">Matière</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                    <SelectItem value="group">Groupe</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Plus de filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions Grid/List */}
        {viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAndSortedSessions.map((sessionWithDetails: any, index: number) => {
              const { group, students } = sessionWithDetails
              
              const statusInfo = statusConfig[sessionWithDetails.status as keyof typeof statusConfig] || {
                label: 'Inconnu',
                color: 'bg-gray-100 text-gray-800',
                icon: AlertCircle
              }
              const StatusIcon = statusInfo.icon
              
              return (
                <motion.div
                  key={sessionWithDetails.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="card-hover border-0 shadow-lg overflow-hidden">
                    {/* Header with gradient */}
                    <div className={`h-16 bg-gradient-to-r ${getSubjectColor(group?.subject)} relative`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute top-3 right-3">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className={`${statusInfo.color} bg-white/90`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      {/* Session info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{group?.name || 'Session sans groupe'}</h3>
                        <p className="text-gray-600 text-sm mb-2">{group?.subject || 'Matière non définie'}</p>
                        <p className="text-gray-500 text-sm line-clamp-2">{sessionWithDetails.notes || 'Aucune note'}</p>
                      </div>
                      
                      {/* Date and time */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(sessionWithDetails.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {getFirstScheduleTime(group?.weeklySchedule) || group?.schedule?.time || 'N/A'} ({group?.schedule?.duration}min)
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          Salle de cours
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{students.length}</div>
                          <div className="text-xs text-gray-600">Étudiants</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{sessionWithDetails.attendanceRate}%</div>
                          <div className="text-xs text-gray-600">Présence</div>
                        </div>
                      </div>
                      
                      {/* Attendance progress */}
                      {sessionWithDetails.attendees && sessionWithDetails.attendees.length > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Présences</span>
                            <span>{sessionWithDetails.attendees.filter((att: any) => att.present).length}/{sessionWithDetails.attendees.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${sessionWithDetails.attendanceRate >= 90 ? 'bg-green-500' : sessionWithDetails.attendanceRate >= 75 ? 'bg-blue-500' : sessionWithDetails.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${sessionWithDetails.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Price */}
                      <div className="mb-4">
                        <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="text-lg font-bold text-green-700">{formatCurrency(group?.paymentConfig?.sessionFee || ((group?.paymentConfig?.monthlyFee || 0) / 4))}</div>
                          <div className="text-xs text-green-600">Prix par session</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedSession(sessionWithDetails)
                            setShowContentModal(true)
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Contenu
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedSession(sessionWithDetails)
                            setShowHistoryModal(true)
                          }}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Historique
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groupe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Heure
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Présence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedSessions.map((sessionWithDetails: any, index: number) => {
                        const { group, students } = sessionWithDetails
                        
                        const statusInfo = statusConfig[sessionWithDetails.status as keyof typeof statusConfig]
                        const StatusIcon = statusInfo.icon
                        
                        return (
                          <motion.tr
                            key={sessionWithDetails.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">Session {group?.subject}</div>
                                <div className="text-sm text-gray-500">Salle de cours</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{group?.name || 'Groupe non défini'}</div>
                                <div className="text-sm text-gray-500">{group?.subject || 'Matière non définie'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{formatDate(sessionWithDetails.date)}</div>
                                <div className="text-sm text-gray-500">
                                  {getFirstScheduleTime(group?.weeklySchedule) || group?.schedule?.time || 'N/A'} ({group?.schedule?.duration}min)
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {sessionWithDetails.attendees && sessionWithDetails.attendees.length > 0 ? (
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`h-2 rounded-full ${sessionWithDetails.attendanceRate >= 90 ? 'bg-green-500' : sessionWithDetails.attendanceRate >= 75 ? 'bg-blue-500' : sessionWithDetails.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${sessionWithDetails.attendanceRate}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-900">
                                    {sessionWithDetails.attendees.filter((att: any) => att.present).length}/{sessionWithDetails.attendees.length}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(group?.paymentConfig?.sessionFee || ((group?.paymentConfig?.monthlyFee || 0) / 4))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(sessionWithDetails)
                                    setShowContentModal(true)
                                  }}
                                >
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(sessionWithDetails)
                                    setShowHistoryModal(true)
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {filteredAndSortedSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center py-12"
          >
            <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {sessionsWithDetails.length === 0 ? 'Aucune session programmée' : 'Aucune session trouvée'}
            </h3>
            <p className="text-gray-600 mb-6">
              {sessionsWithDetails.length === 0 
                ? 'Commencez par programmer votre première session'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            {sessionsWithDetails.length === 0 && (
              <Link href="/dashboard/sessions/nouvelle">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Programmer ma première session
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Modals */}
        {showContentModal && selectedSession && (
          <CourseContentModal
            session={selectedSession}
            isOpen={showContentModal}
            onClose={() => {
              setShowContentModal(false)
              setSelectedSession(null)
            }}
          />
        )}

        {showHistoryModal && selectedSession && (
          <SessionHistoryModal
            group={selectedSession.group}
            isOpen={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedSession(null)
            }}
          />
        )}
      </div>
    </div>
  )
}