'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTime, formatDate, getFirstScheduleTime } from '@/lib/utils'
import AddSessionModal from '@/components/modals/AddSessionModal'
import { AttendanceModal } from '@/components/attendance/attendance-modal'
import { PaymentModal } from '@/components/payments/payment-modal'

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

interface Session {
  id: string
  groupId: string
  date: string
  duration?: number
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  group: {
    id: string
    name: string
    subject: string
    scheduleDay: string
    scheduleTime: string
    scheduleDuration: number
    weeklySchedule?: any
    _count?: {
      students: number
    }
  }
  attendance: Array<{
    id: string
    studentId: string
    present: boolean
    student: {
      id: string
      name: string
    }
  }>
}

interface Group {
  id: string
  name: string
  subject: string
  scheduleDay: string
  scheduleTime: string
  scheduleDuration: number
  students?: Array<{
    student: {
      id: string
      name: string
      email?: string
      phone?: string
      classe?: string
      lycee?: string
    }
  }>
  weeklySchedule?: Array<{
    dayOfWeek: string | number
    startTime: string
    duration: number
  }>
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  sessions: Session[]
}

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalSelectedDate, setModalSelectedDate] = useState<Date | null>(null)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch sessions and groups
        const [sessionsResponse, groupsResponse] = await Promise.all([
          fetch('/api/sessions'),
          fetch('/api/groups')
        ])

        if (!sessionsResponse.ok || !groupsResponse.ok) {
          // Clear data when authentication fails or other errors occur
          setSessions([])
          setGroups([])
          throw new Error('Failed to fetch data')
        }

        const [sessionsData, groupsData] = await Promise.all([
          sessionsResponse.json(),
          groupsResponse.json()
        ])

        setSessions(sessionsData)
        setGroups(groupsData)
      } catch (err) {
        console.error('Error fetching calendar data:', err)
        // Ensure data is cleared on any error
        setSessions([])
        setGroups([])
        setError('Failed to load calendar data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate calendar days for current month
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()
    
    const days: CalendarDay[] = []
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: getSessionsForDate(date)
      })
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const today = new Date()
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        sessions: getSessionsForDate(date)
      })
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: getSessionsForDate(date)
      })
    }
    
    return days
  }

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.date)
      return sessionDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const openAddModal = (date?: Date) => {
    setModalSelectedDate(date || selectedDate || new Date())
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setModalSelectedDate(null)
  }

  const handleCreateSession = async (sessionData: {
    groupId: string
    date: string
    duration?: number
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const newSession = await response.json()
      
      // Add the new session to the state
      setSessions(prev => [...prev, newSession])
      
      // Show success message (you can add a toast notification here)
      console.log('Session created successfully')
    } catch (error) {
      console.error('Error creating session:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const calendarDays = generateCalendarDays()
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : []

  // Filter sessions based on search and group filter
  const filteredSessions = selectedDateSessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.group.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = !filterGroup || session.groupId === filterGroup
    return matchesSearch && matchesGroup
  })

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du calendrier...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
            <p className="text-gray-600 mt-1">Gérez vos cours et planifiez vos sessions</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <Button className="btn-primary" onClick={() => openAddModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau cours
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('month')}
                    >
                      Mois
                    </Button>
                    <Button
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('week')}
                    >
                      Semaine
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.01 }}
                      className={`
                        relative p-2 min-h-[80px] border border-gray-100 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                        ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                        ${day.isToday ? 'ring-2 ring-indigo-500' : ''}
                        ${selectedDate?.toDateString() === day.date.toDateString() ? 'bg-indigo-50 border-indigo-200' : ''}
                      `}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${day.isToday ? 'text-indigo-600' : ''}
                      `}>
                        {day.date.getDate()}
                      </div>
                      
                      {/* Session indicators */}
                      <div className="space-y-1">
                        {day.sessions.slice(0, 2).map((session, sessionIndex) => {
                          return (
                            <div
                              key={sessionIndex}
                              className={`
                                text-xs px-1 py-0.5 rounded truncate
                                ${session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  session.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'}
                              `}
                              title={`${session.group.name} - ${getFirstScheduleTime(session.group.weeklySchedule) || session.group.scheduleTime || 'N/A'}`}
                            >
                              {session.group.name}
                            </div>
                          )
                        })}
                        {day.sessions.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{day.sessions.length - 2} autres
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Selected Date Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Date Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {selectedDate ? formatDate(selectedDate) : 'Sélectionnez une date'}
                </CardTitle>
                {selectedDate && (
                  <CardDescription>
                    {filteredSessions.length} cours prévu{filteredSessions.length !== 1 ? 's' : ''}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>

            {/* Filters */}
            {selectedDate && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Filtres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <select
                      value={filterGroup}
                      onChange={(e) => setFilterGroup(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Tous les groupes</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions List */}
            {selectedDate && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Cours du jour</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredSessions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredSessions.map((session) => {
                        return (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{session.group.name}</h4>
                              <span className={`
                                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  session.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'}
                              `}>
                                {session.status === 'COMPLETED' ? 'Terminé' :
                                 session.status === 'SCHEDULED' ? 'Programmé' : 'Annulé'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {getFirstScheduleTime(session.group.weeklySchedule) || session.group.scheduleTime || 'N/A'} ({session.group.scheduleDuration || session.duration || 60} min)
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {session.group.subject}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {session.group._count?.students || 0} étudiant{(session.group._count?.students || 0) !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-1">
                              <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/groups/${session.group.id}`)
                                    if (response.ok) {
                                      const fullGroup = await response.json()
                                      setSelectedGroup(fullGroup)
                                      setIsAttendanceModalOpen(true)
                                    }
                                  } catch (error) {
                                    console.error('Error fetching group details:', error)
                                  }
                                }}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                Présence
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/groups/${session.group.id}`)
                                    if (response.ok) {
                                      const fullGroup = await response.json()
                                      setSelectedGroup(fullGroup)
                                      setIsPaymentModalOpen(true)
                                    }
                                  } catch (error) {
                                    console.error('Error fetching group details:', error)
                                  }
                                }}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Paiements
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
                                <Edit className="h-3 w-3 mr-1" />
                                Modifier
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs px-2 py-1 text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {selectedDateSessions.length === 0 
                          ? 'Aucun cours prévu ce jour'
                          : 'Aucun cours ne correspond aux filtres'
                        }
                      </p>
                      <Button className="mt-4" variant="outline" onClick={() => openAddModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un cours
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Add Session Modal */}
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleCreateSession}
        groups={groups}
        selectedDate={modalSelectedDate || undefined}
        loading={loading}
      />
      
      {/* Attendance Modal */}
      {selectedGroup && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false)
            setSelectedGroup(null)
          }}
          group={selectedGroup}
          onSuccess={() => {
            // Refresh data if needed
          }}
        />
      )}
      
      {/* Payment Modal */}
      {selectedGroup && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedGroup(null)
          }}
          group={selectedGroup}
          onSuccess={() => {
            // Refresh data if needed
          }}
        />
      )}
    </div>
  )
}