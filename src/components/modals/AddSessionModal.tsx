'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Users, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateForInput } from '@/lib/utils'

interface Group {
  id: string
  name: string
  subject: string
  scheduleDay: string
  scheduleTime: string
  scheduleDuration: number
}

interface AddSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (sessionData: {
    groupId: string
    date: string
    duration?: number
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    notes?: string
  }) => Promise<void>
  groups: Group[]
  selectedDate?: Date
  loading?: boolean
}

export default function AddSessionModal({
  isOpen,
  onClose,
  onSubmit,
  groups,
  selectedDate,
  loading = false
}: AddSessionModalProps) {
  const [formData, setFormData] = useState<{
    groupId: string
    date: string
    time: string
    duration: string
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    notes: string
  }>({
    groupId: '',
    date: selectedDate ? formatDateForInput(selectedDate) : '',
    time: '',
    duration: '', // Will be populated from selected group's default
    status: 'SCHEDULED',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.groupId) {
      newErrors.groupId = 'Veuillez sélectionner un groupe'
    }
    if (!formData.date) {
      newErrors.date = 'Veuillez sélectionner une date'
    }
    if (!formData.time) {
      newErrors.time = 'Veuillez sélectionner une heure'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Combine date and time into ISO datetime string
      const datetime = new Date(`${formData.date}T${formData.time}:00`).toISOString()
      
      await onSubmit({
        groupId: formData.groupId,
        date: datetime,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        status: formData.status,
        notes: formData.notes || undefined
      })
      
      // Reset form and close modal
      setFormData({
        groupId: '',
        date: selectedDate ? formatDateForInput(selectedDate) : '',
        time: '',
        duration: '',
        status: 'SCHEDULED',
        notes: ''
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        groupId: '',
        date: selectedDate ? formatDateForInput(selectedDate) : '',
        time: '',
        duration: '',
        status: 'SCHEDULED',
        notes: ''
      })
      setErrors({})
      onClose()
    }
  }

  // Auto-populate duration when group is selected
  const handleGroupChange = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId)
    setFormData(prev => ({
      ...prev,
      groupId,
      duration: selectedGroup ? selectedGroup.scheduleDuration.toString() : '',
      time: selectedGroup ? selectedGroup.scheduleTime : prev.time
    }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">
                  Nouveau cours
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={submitting}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Group Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Groupe
                    </label>
                    <select
                      value={formData.groupId}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitting}
                    >
                      <option value="">Sélectionner un groupe</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} - {group.subject}
                        </option>
                      ))}
                    </select>
                    {errors.groupId && (
                      <p className="text-sm text-red-600">{errors.groupId}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      disabled={submitting}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-600">{errors.date}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Heure
                    </label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      disabled={submitting}
                    />
                    {errors.time && (
                      <p className="text-sm text-red-600">{errors.time}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Durée (minutes)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Durée en minutes"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500">
                      Laissez vide pour utiliser la durée par défaut du groupe
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitting}
                    >
                      <option value="SCHEDULED">Programmé</option>
                      <option value="COMPLETED">Terminé</option>
                      <option value="CANCELLED">Annulé</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ajouter des notes pour ce cours..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={submitting}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || loading}
                      className="flex-1"
                    >
                      {submitting ? 'Création...' : 'Créer le cours'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}