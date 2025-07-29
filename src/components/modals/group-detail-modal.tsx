'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X, Users, Calendar, DollarSign, Clock, CheckCircle, XCircle,
  AlertCircle, Edit, Trash2, UserMinus, FileText, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudents } from '@/hooks/useStudents'
import { formatCurrency, formatDate, formatWeeklySchedule } from '@/lib/utils'
import type { Group, Student } from '@/lib/types'
import { useToast } from '@/components/ui/toast'

interface GroupDetailModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group | null
  onEdit?: (group: Group) => void
  onDelete?: (groupId: string) => void
  onRemoveStudent?: (groupId: string, studentId: string) => void
  onAddStudent?: () => void
}

export default function GroupDetailModal({
  isOpen,
  onClose,
  group,
  onEdit,
  onDelete,
  onRemoveStudent,
  onAddStudent
}: GroupDetailModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})

  const { students } = useStudents()

  const groupStudents = useMemo(() => {
    if (!group || !students || !group.students) return []
    return students.filter(student => 
      group.students!.some((gs: any) => gs.studentId === student.id)
    )
  }, [group, students])

  const [studentsWithPaymentStatus, setStudentsWithPaymentStatus] = useState<any[]>([])
  
  const getStatusMessage = (status: string, sessions: number) => {
    switch (status) {
      case 'A_JOUR':
        return 'Paiements à jour'
      case 'EN_ATTENTE':
        return `${sessions} sessions en attente de paiement`
      case 'EN_RETARD':
        return 'Paiement en retard'
      default:
        return 'Statut inconnu'
    }
  }
  
  // Calculate payment statuses asynchronously using API
  useMemo(() => {
    if (!group || !groupStudents.length) {
      setStudentsWithPaymentStatus([])
      return
    }

    const calculateStatuses = async () => {
      const studentsWithStatus = await Promise.all(
        groupStudents.map(async (student) => {
          try {
            const response = await fetch(`/api/students/${student.id}/payment-status?groupId=${group.id}`)
            if (!response.ok) {
              throw new Error('Failed to fetch payment status')
            }
            const paymentStatus = await response.json()
            return {
              ...student,
              paymentStatus: {
                status: paymentStatus.currentStatus?.toLowerCase() || 'unknown',
                amount: paymentStatus.amountDue || 0,
                currentCycleSessions: paymentStatus.totalSessionsInCycle || 0,
                attendedSessions: paymentStatus.attendedSessions || 0,
                nextPaymentAmount: paymentStatus.amountDue || 0,
                statusMessage: getStatusMessage(paymentStatus.currentStatus, paymentStatus.totalSessionsInCycle)
              }
            }
          } catch (error) {
            console.error('Error calculating payment status for student:', student.id, error)
            return {
              ...student,
              paymentStatus: { 
                status: 'unknown', 
                amount: 0,
                currentCycleSessions: 0,
                attendedSessions: 0,
                nextPaymentAmount: 0,
                statusMessage: 'Erreur de calcul'
              }
            }
          }
        })
      )
      setStudentsWithPaymentStatus(studentsWithStatus)
    }

    calculateStatuses()
  }, [group, groupStudents])

  const groupSessions = useMemo(() => {
    if (!group) return []
    return (group.sessions || [])
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [group])

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">À jour</Badge>
      case 'approaching':
        return <Badge className="bg-yellow-100 text-yellow-800">Proche échéance</Badge>
      case 'due':
        return <Badge variant="destructive">Paiement dû</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">En retard</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }))
  }

  const submitAttendance = () => {
    // Here you would typically save the attendance to your backend
    console.log('Submitting attendance for', attendanceDate, attendance)
    // Reset attendance form
    setAttendance({})
    toast({
      type: 'success',
      title: 'Présence enregistrée avec succès!'
    })
  }

  if (!isOpen || !group) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-indigo-100 mt-1">
              {group.subject} • {formatWeeklySchedule(group.weeklySchedule) || (group.scheduleDay && group.scheduleTime ? `${group.scheduleDay} à ${group.scheduleTime}` : 'N/A à N/A')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(group)}
                className="text-white hover:bg-white/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(group.id)}
                className="text-white hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Aperçu', icon: Users },
            { id: 'students', label: 'Étudiants', icon: Users }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Group Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Étudiants</p>
                        <p className="text-2xl font-bold text-gray-900">{groupStudents.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{groupSessions.length}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Prix/cycle</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            group.paymentConfig?.monthlyFee || 
                            group.monthlyFee || 
                            (group.sessionFee && group.paymentThreshold ? group.sessionFee * group.paymentThreshold : 0)
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Durée</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {group.scheduleDuration || 
                           (group.weeklySchedule && Array.isArray(group.weeklySchedule) && group.weeklySchedule[0]?.duration) || 
                           60}min
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Group Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du groupe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sessions par cycle</p>
                      <p className="font-medium">4 sessions</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix par session</p>
                      <p className="font-medium">
                        {formatCurrency(
                          group?.paymentConfig?.sessionFee || 
                          group?.sessionFee || 
                          ((group?.paymentConfig?.monthlyFee || group?.monthlyFee) ? (group?.paymentConfig?.monthlyFee || group?.monthlyFee || 0) / 4 : 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Politique d'absence</p>
                      <p className="font-medium">
                        {group?.paymentConfig?.countAbsentSessions
                          ? 'Les absences comptent dans le cycle'
                          : 'Seules les présences comptent'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <Badge className={group?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {group?.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Liste des étudiants ({groupStudents.length})</h3>
                {onAddStudent && (
                  <Button 
                    size="sm" 
                    className="bg-indigo-600"
                    onClick={onAddStudent}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ajouter un étudiant
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {studentsWithPaymentStatus.map(student => (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{student.name}</h4>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              {student.phone && (
                                <p className="text-sm text-gray-600">{student.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Sessions</p>
                            <p className="font-medium">
                              {student.paymentStatus?.currentCycleSessions || 0}/4
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Statut</p>
                            {getPaymentStatusBadge(student.paymentStatus?.status || 'unknown')}
                          </div>
                          
                          {onRemoveStudent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveStudent(group?.id || '', student.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {(student.paymentStatus?.overflowSessions || 0) > 0 && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                            <p className="text-sm text-orange-800">
                              {student.paymentStatus?.overflowSessions || 0} session(s) en attente de paiement
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}




        </div>
      </motion.div>
    </div>
  )
}