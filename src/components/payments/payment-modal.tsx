'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, X, Plus, Edit, Trash2, Calendar, CreditCard } from 'lucide-react'

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

interface Payment {
  id: string
  studentId: string
  amount: number
  type: 'MONTHLY_FEE' | 'SESSION_FEE' | 'REGISTRATION_FEE'
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidDate?: string
  paymentMethod?: string
  notes?: string
  student: {
    id: string
    name: string
    email?: string
  }
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  onSuccess?: () => void
}

const paymentTypeConfig = {
  MONTHLY_FEE: {
    label: 'Frais mensuel',
    color: 'bg-blue-100 text-blue-800'
  },
  SESSION_FEE: {
    label: 'Frais de session',
    color: 'bg-green-100 text-green-800'
  },
  REGISTRATION_FEE: {
    label: 'Frais d\'inscription',
    color: 'bg-purple-100 text-purple-800'
  }
}

const paymentStatusConfig = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800'
  },
  PAID: {
    label: 'Payé',
    color: 'bg-green-100 text-green-800'
  },
  OVERDUE: {
    label: 'En retard',
    color: 'bg-red-100 text-red-800'
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-gray-100 text-gray-800'
  }
}

export function PaymentModal({ isOpen, onClose, group, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state for creating new payment
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    type: 'SESSION_FEE' as const,
    paymentMethod: '',
    dueDate: new Date().toISOString().split('T')[0],
    paidDate: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchPayments()
    }
  }, [isOpen, group.id])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/payments?groupId=${group.id}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const payload = {
        studentId: formData.studentId,
        groupId: group.id,
        amount: parseFloat(formData.amount),
        type: formData.type,
        paymentMethod: formData.paymentMethod || undefined,
        dueDate: new Date(formData.dueDate).toISOString(),
        paidDate: formData.paidDate ? new Date(formData.paidDate).toISOString() : undefined,
        notes: formData.notes || undefined
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création du paiement')
      }

      alert('Paiement créé avec succès')
      setFormData({
        studentId: '',
        amount: '',
        type: 'SESSION_FEE',
        paymentMethod: '',
        dueDate: new Date().toISOString().split('T')[0],
        paidDate: '',
        notes: ''
      })
      setActiveTab('list')
      fetchPayments()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating payment:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la création du paiement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: paymentId,
          status: 'PAID',
          paidDate: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du paiement')
      }

      alert('Paiement marqué comme payé')
      fetchPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Erreur lors de la mise à jour du paiement')
    }
  }

  const deletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return
    }

    try {
      const response = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du paiement')
      }

      alert('Paiement supprimé avec succès')
      fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Erreur lors de la suppression du paiement')
    }
  }

  const getDefaultAmount = (type?: string) => {
    const paymentType = type || formData.type
    switch (paymentType) {
      case 'SESSION_FEE':
        return group.sessionFee?.toString() || ''
      case 'MONTHLY_FEE':
        return group.monthlyFee?.toString() || ''
      default:
        return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Gestion des paiements - {group.name}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Liste des paiements
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau paiement
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement des paiements...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun paiement trouvé pour ce groupe.</p>
                  <Button 
                    onClick={() => setActiveTab('create')} 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier paiement
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {payment.student.name}
                              </h4>
                              <Badge className={paymentTypeConfig[payment.type].color}>
                                {paymentTypeConfig[payment.type].label}
                              </Badge>
                              <Badge className={paymentStatusConfig[payment.status].color}>
                                {paymentStatusConfig[payment.status].label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Montant:</span>
                                <p>{payment.amount} DT</p>
                              </div>
                              <div>
                                <span className="font-medium">Échéance:</span>
                                <p>{new Date(payment.dueDate).toLocaleDateString('fr-FR')}</p>
                              </div>
                              {payment.paidDate && (
                                <div>
                                  <span className="font-medium">Payé le:</span>
                                  <p>{new Date(payment.paidDate).toLocaleDateString('fr-FR')}</p>
                                </div>
                              )}
                              {payment.paymentMethod && (
                                <div>
                                  <span className="font-medium">Méthode:</span>
                                  <p>{payment.paymentMethod}</p>
                                </div>
                              )}
                            </div>
                            
                            {payment.notes && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-600">Notes:</span>
                                <p className="text-sm text-gray-600">{payment.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {payment.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(payment.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Marquer payé
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePayment(payment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Étudiant *</Label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un étudiant</option>
                    {(group.students || []).map((studentGroup) => (
                      <option key={studentGroup.student.id} value={studentGroup.student.id}>
                        {studentGroup.student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Type de paiement *</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as typeof formData.type
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        amount: getDefaultAmount(newType)
                      })
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(paymentTypeConfig).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Montant (DT) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder={getDefaultAmount() || "0.00"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Méthode de paiement</Label>
                  <Input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="Espèces, Virement, Chèque..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date d'échéance *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de paiement (si déjà payé)</Label>
                  <Input
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('list')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.studentId || !formData.amount}
                >
                  {isSubmitting ? 'Création...' : 'Créer le paiement'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}