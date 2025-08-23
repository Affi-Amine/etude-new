'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, X, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface Student {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Group {
  id: string
  name: string
  subject: string
  sessionFee?: number
  monthlyFee?: number
  paymentThreshold?: number
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
}

interface StudentSessionData {
  studentId: string
  studentName: string
  sessionsAttended: number
  paymentThreshold: number
  sessionFee: number
  totalAmount: number
  isPaid: boolean
  lastPaymentDate?: string
}

interface SessionPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  onSuccess?: () => void
}

export function SessionPaymentModal({ isOpen, onClose, group, onSuccess }: SessionPaymentModalProps) {
  const [studentsData, setStudentsData] = useState<StudentSessionData[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && group) {
      fetchStudentSessionData()
    }
  }, [isOpen, group])

  const fetchStudentSessionData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/student-sessions?groupId=${group.id}`)
      if (response.ok) {
        const data = await response.json()
        setStudentsData(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching student session data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markStudentAsPaid = async (studentId: string, amount: number) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          groupId: group.id,
          amount,
          type: 'SESSION_FEE',
          status: 'PAID',
          paidDate: new Date().toISOString(),
          dueDate: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du paiement')
      }

      // Refresh data
      await fetchStudentSessionData()
      toast({
        type: 'success',
        title: 'Paiement enregistré avec succès'
      })
      onSuccess?.()
    } catch (error) {
      console.error('Error marking student as paid:', error)
      toast({
        type: 'error',
        title: 'Erreur lors de l\'enregistrement du paiement'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (sessionsAttended: number, threshold: number) => {
    if (sessionsAttended < threshold) {
      return 'bg-green-100 text-green-800 border-green-300'
    } else if (sessionsAttended === threshold) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    } else {
      return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const getStatusIcon = (sessionsAttended: number, threshold: number) => {
    if (sessionsAttended < threshold) {
      return <Clock className="h-4 w-4" />
    } else if (sessionsAttended === threshold) {
      return <AlertCircle className="h-4 w-4" />
    } else {
      return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusText = (sessionsAttended: number, threshold: number) => {
    if (sessionsAttended < threshold) {
      return 'En cours'
    } else if (sessionsAttended === threshold) {
      return 'Seuil atteint'
    } else {
      return 'Paiement dû'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              Suivi des paiements - {group.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sessions par mois: {group.paymentThreshold || 8} sessions (= seuil de paiement)
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Légende des statuts:</h3>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
                  <Clock className="h-3 w-3" />
                  <span>En cours</span>
                </div>
                <span className="text-gray-600">Moins de {group.paymentThreshold || 8} sessions ce mois</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                  <AlertCircle className="h-3 w-3" />
                  <span>Mois complet</span>
                </div>
                <span className="text-gray-600">Exactement {group.paymentThreshold || 8} sessions ce mois</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
                  <DollarSign className="h-3 w-3" />
                  <span>Paiement dû</span>
                </div>
                <span className="text-gray-600">Plus de {group.paymentThreshold || 8} sessions ce mois</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {studentsData.length > 0 ? (
                studentsData.map((student) => {
                  const threshold = student.paymentThreshold || group.paymentThreshold || 8
                  const sessionFee = student.sessionFee || group.sessionFee || 0
                  const defaultAmount = threshold * sessionFee
                  
                  return (
                    <Card key={student.studentId} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{student.studentName}</h4>
                              <Badge 
                                className={`flex items-center gap-1 ${getStatusColor(student.sessionsAttended, threshold)}`}
                              >
                                {getStatusIcon(student.sessionsAttended, threshold)}
                                {getStatusText(student.sessionsAttended, threshold)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>Sessions: {student.sessionsAttended}/{threshold}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>Montant mensuel: {formatCurrency(defaultAmount)}</span>
                              </div>
                              {student.isPaid && student.lastPaymentDate && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Payé le {new Date(student.lastPaymentDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {student.sessionsAttended >= threshold && !student.isPaid && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => markStudentAsPaid(student.studentId, defaultAmount)}
                                disabled={isSubmitting}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marquer comme payé
                              </Button>
                            )}
                            
                            {student.isPaid && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Payé
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progression du mois</span>
                            <span>{student.sessionsAttended}/{threshold} sessions</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                student.sessionsAttended < threshold 
                                  ? 'bg-green-500' 
                                  : student.sessionsAttended === threshold 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.min((student.sessionsAttended / threshold) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun étudiant trouvé pour ce groupe</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}