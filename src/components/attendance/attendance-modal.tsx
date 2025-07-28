'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  classe?: string
  lycee?: string
}

interface StudentGroup {
  student: Student
}

interface WeeklySchedule {
  duration: number
  dayOfWeek: number
  startTime: string
}

interface Group {
  id: string
  name: string
  subject: string
  students?: StudentGroup[]
  weeklySchedule?: WeeklySchedule[]
  scheduleDuration?: number
}

interface AttendanceRecord {
  studentId: string
  status: 'PRESENT' | 'ABSENT'
  notes?: string
}

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  sessionId?: string
  onSuccess?: () => void
}

const statusConfig = {
  PRESENT: {
    label: 'Présent',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    buttonColor: 'bg-green-500 hover:bg-green-600 text-white',
    iconColor: 'text-green-500'
  },
  ABSENT: {
    label: 'Absent',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    buttonColor: 'bg-red-500 hover:bg-red-600 text-white',
    iconColor: 'text-red-500'
  }
}

export function AttendanceModal({ isOpen, onClose, group, sessionId, onSuccess }: AttendanceModalProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState<number>(() => {
    // Use the duration from weeklySchedule if available, otherwise use scheduleDuration or default to 60
    if (group.weeklySchedule && group.weeklySchedule.length > 0) {
      return group.weeklySchedule[0].duration
    }
    return group.scheduleDuration || 60
  })
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(
    (group.students || []).map(studentGroup => ({
      studentId: studentGroup.student.id,
      status: 'PRESENT' as const,
      notes: ''
    }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false)

  useEffect(() => {
    if (isOpen && group.students) {
      setAttendanceData(
        (group.students || []).map(studentGroup => ({
          studentId: studentGroup.student.id,
          status: 'PRESENT' as const,
          notes: ''
        }))
      )
      
      // Check if attendance already exists for this session
      if (sessionId) {
        checkExistingAttendance()
      }
    }
  }, [isOpen, group.students, sessionId])
  
  const checkExistingAttendance = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`/api/attendance?sessionId=${sessionId}`)
      if (response.ok) {
        const existingAttendance = await response.json()
        if (existingAttendance && existingAttendance.length > 0) {
          setHasExistingAttendance(true)
          // Load existing attendance data
          const existingData = existingAttendance.map((record: any) => ({
            studentId: record.studentId,
            status: record.status,
            notes: record.notes || ''
          }))
          setAttendanceData(existingData)
        }
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error)
    }
  }

  const updateAttendance = (studentId: string, field: keyof AttendanceRecord, value: any) => {
    setAttendanceData(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, [field]: value }
          : record
      )
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const payload = sessionId 
        ? {
            sessionId,
            attendanceData
          }
        : {
            groupId: group.id,
            date: date.toISOString(),
            duration,
            attendanceData
          }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'enregistrement')
      }

      alert(hasExistingAttendance ? 'Présences mises à jour avec succès' : 'Présences enregistrées avec succès')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error submitting attendance:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const presentCount = attendanceData.filter(record => record.status === 'PRESENT').length
  const absentCount = attendanceData.filter(record => record.status === 'ABSENT').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Gestion des présences - {group.name}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6 p-6">
          {/* Existing Attendance Warning */}
          {hasExistingAttendance && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-amber-800">Présence déjà enregistrée</h4>
                  <p className="text-sm text-amber-700">
                    La présence a déjà été prise pour cette session. Vous pouvez modifier les statuts si nécessaire.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Session Info */}
          {!sessionId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Date de la session</Label>
                <Input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(new Date(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  min={15}
                  max={300}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              {presentCount} Présent{presentCount > 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              <XCircle className="h-3 w-3 mr-1 text-red-600" />
              {absentCount} Absent{absentCount > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Attendance List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Liste des étudiants</h3>
            <div className="space-y-3">
              {(group.students || []).map((studentGroup) => {
                const student = studentGroup.student
                const record = attendanceData.find(r => r.studentId === student.id)!
                return (
                  <div key={student.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{student.name}</h4>
                        {student.email && (
                          <p className="text-sm text-gray-500">{student.email}</p>
                        )}
                      </div>
                      
                      {/* Visual Status Buttons */}
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={record.status === 'PRESENT' ? 'default' : 'outline'}
                            className={record.status === 'PRESENT' 
                              ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                            }
                            onClick={() => updateAttendance(student.id, 'status', 'PRESENT')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Présent
                          </Button>
                          
                          <Button
                            type="button"
                            size="sm"
                            variant={record.status === 'ABSENT' ? 'default' : 'outline'}
                            className={record.status === 'ABSENT' 
                              ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                            }
                            onClick={() => updateAttendance(student.id, 'status', 'ABSENT')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                        
                        {/* Status Badge */}
                        <Badge className={statusConfig[record.status].color}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{statusConfig[record.status].label}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Notes Section - Only show if there are notes or if user wants to add notes */}
                    {(record.notes || record.status === 'ABSENT') && (
                      <div className="mt-3 pt-3 border-t">
                        <Label className="text-sm text-gray-600">Notes (optionnel)</Label>
                        <textarea
                          placeholder={record.status === 'ABSENT' ? 'Raison de l\'absence...' : 'Ajouter une note...'}
                          value={record.notes || ''}
                          onChange={(e) => updateAttendance(student.id, 'notes', e.target.value)}
                          rows={2}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting 
                ? (hasExistingAttendance ? 'Mise à jour...' : 'Enregistrement...') 
                : (hasExistingAttendance ? 'Mettre à jour les présences' : 'Enregistrer les présences')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}