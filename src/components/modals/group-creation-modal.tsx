'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Users, Clock, DollarSign, Calendar, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { GroupFormData, Student, Group } from '@/lib/types'

interface GroupCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (groupData: GroupFormData & { newStudents?: NewStudentData[] }) => void
  availableStudents: Student[]
  editingGroup?: Group | null
}

interface NewStudentData {
  name: string
  classe: string
  lycee: string
  phone: string
  email?: string
}

const DAYS_OF_WEEK = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
]

const SUBJECTS = [
  'Mathématiques', 'Physique', 'Chimie', 'Français', 'Anglais', 'Arabe',
  'Sciences', 'Histoire', 'Géographie', 'Philosophie', 'Informatique'
]

export default function GroupCreationModal({
  isOpen,
  onClose,
  onSubmit,
  availableStudents,
  editingGroup
}: GroupCreationModalProps) {
  const [formData, setFormData] = useState<GroupFormData>({
    name: editingGroup?.name || '',
    subject: editingGroup?.subject || '',
    schedule: {
      day: editingGroup?.scheduleDay || '',
      time: editingGroup?.scheduleTime || '',
      duration: editingGroup?.scheduleDuration || 120
    },
    paymentConfig: {
      monthlyFee: editingGroup?.paymentConfig?.monthlyFee || editingGroup?.monthlyFee || 0,
      sessionFee: editingGroup?.paymentConfig?.sessionFee || editingGroup?.sessionFee,
      registrationFee: editingGroup?.paymentConfig?.registrationFee || editingGroup?.registrationFee,
      paymentDeadline: editingGroup?.paymentConfig?.paymentDeadline || editingGroup?.paymentDeadline || 30,
      countAbsentSessions: editingGroup?.paymentConfig?.countAbsentSessions || true
    },
    studentIds: editingGroup?.studentIds || []
  })

  const [selectedStudents, setSelectedStudents] = useState<string[]>(editingGroup?.studentIds || [])
  const [newStudents, setNewStudents] = useState<NewStudentData[]>([])
  const [currentStudent, setCurrentStudent] = useState<NewStudentData>({
    name: '',
    classe: '',
    lycee: '',
    phone: '',
    email: ''
  })

  // Reset form when editingGroup changes
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        subject: editingGroup.subject,
        schedule: {
          day: editingGroup.scheduleDay,
          time: editingGroup.scheduleTime,
          duration: editingGroup.scheduleDuration
        },
        paymentConfig: {
          monthlyFee: editingGroup.paymentConfig?.monthlyFee || editingGroup.monthlyFee,
          sessionFee: editingGroup.paymentConfig?.sessionFee || editingGroup.sessionFee,
          registrationFee: editingGroup.paymentConfig?.registrationFee || editingGroup.registrationFee,
          paymentDeadline: editingGroup.paymentConfig?.paymentDeadline || editingGroup.paymentDeadline,
          countAbsentSessions: editingGroup.paymentConfig?.countAbsentSessions
        },
        studentIds: editingGroup.studentIds
      })
      setSelectedStudents(editingGroup.studentIds)
    } else {
      setFormData({
        name: '',
        subject: '',
        schedule: {
          day: '',
          time: '',
          duration: 120
        },
        paymentConfig: {
          monthlyFee: 0,
          sessionFee: undefined,
          registrationFee: undefined,
          paymentDeadline: 30,
          countAbsentSessions: false
        },
        studentIds: []
      })
      setSelectedStudents([])
      setNewStudents([])
      setCurrentStudent({
        name: '',
        classe: '',
        lycee: '',
        phone: '',
        email: ''
      })
    }
  }, [editingGroup])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.subject.trim() !== '' &&
      formData.schedule.day !== '' &&
      formData.schedule.time !== '' &&
      formData.paymentConfig.monthlyFee > 0 &&
      (selectedStudents.length > 0 || newStudents.length > 0)
    )
  }, [formData, selectedStudents, newStudents])

  const isCurrentStudentValid = useMemo(() => {
    return (
      currentStudent.name.trim() !== '' &&
      currentStudent.classe.trim() !== '' &&
      currentStudent.lycee.trim() !== '' &&
      currentStudent.phone.trim() !== ''
    )
  }, [currentStudent])

  const addNewStudent = () => {
    if (currentStudent.name && currentStudent.classe && currentStudent.lycee && currentStudent.phone) {
      setNewStudents(prev => [...prev, currentStudent])
      setCurrentStudent({
        name: '',
        classe: '',
        lycee: '',
        phone: '',
        email: ''
      })
    }
  }

  const removeNewStudent = (index: number) => {
    setNewStudents(prev => prev.filter((_, i) => i !== index))
  }



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const groupData: GroupFormData = {
      ...formData,
      studentIds: selectedStudents
    }
    onSubmit({
      ...groupData,
      newStudents: newStudents
    })
    onClose()
    // Reset form
    setFormData({
      name: '',
      subject: '',
      schedule: { day: '', time: '', duration: 60 },
      paymentConfig: { monthlyFee: 0, sessionFee: undefined, registrationFee: undefined, paymentDeadline: 30, countAbsentSessions: true },
      studentIds: []
    })
    setSelectedStudents([])
    setNewStudents([])
    setCurrentStudent({
      name: '',
      classe: '',
      lycee: '',
      phone: '',
      email: ''
    })
    setErrors({})
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingGroup ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingGroup ? 'Modifiez les détails du groupe' : 'Configurez les détails de votre groupe d\'étudiants'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Informations de base
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du groupe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Mathématiques Niveau Bac"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="subject">Matière *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger className={errors.subject ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Horaire
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="day">Jour *</Label>
                <Select
                  value={formData.schedule.day}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, day: value }
                  }))}
                >
                  <SelectTrigger className={errors.day ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.day && <p className="text-red-500 text-sm mt-1">{errors.day}</p>}
              </div>
              
              <div>
                <Label htmlFor="time">Heure *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, time: e.target.value }
                  }))}
                  className={errors.time ? 'border-red-500' : ''}
                />
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
              </div>
              
              <div>
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="30"
                  max="180"
                  step="15"
                  value={formData.schedule.duration}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, duration: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
              Configuration des paiements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyFee">Frais mensuel (DT) *</Label>
                <Input
                  id="monthlyFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentConfig.monthlyFee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentConfig: {
                      ...prev.paymentConfig,
                      monthlyFee: parseFloat(e.target.value) || 0
                    }
                  }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="sessionFee">Frais par session (DT)</Label>
                <Input
                  id="sessionFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentConfig.sessionFee || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentConfig: {
                      ...prev.paymentConfig,
                      sessionFee: parseFloat(e.target.value) || undefined
                    }
                  }))}
                  placeholder="ex: 80.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="registrationFee">Frais d'inscription (DT)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentConfig.registrationFee || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentConfig: {
                      ...prev.paymentConfig,
                      registrationFee: parseFloat(e.target.value) || undefined
                    }
                  }))}
                  placeholder="ex: 50.00"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentDeadline">Délai de paiement (jours)</Label>
                <Input
                  id="paymentDeadline"
                  type="number"
                  min="1"
                  value={formData.paymentConfig.paymentDeadline}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentConfig: {
                      ...prev.paymentConfig,
                      paymentDeadline: parseInt(e.target.value) || 30
                    }
                  }))}
                  placeholder="ex: 30"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="countAbsentSessions"
                checked={formData.paymentConfig.countAbsentSessions}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paymentConfig: {
                    ...prev.paymentConfig,
                    countAbsentSessions: e.target.checked
                  }
                }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="countAbsentSessions" className="text-sm">
                Compter les absences dans le cycle de paiement
              </Label>
            </div>
          </div>

          {/* Student Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Gestion des étudiants *
            </h3>
            
            {/* Existing Students Selection */}
            {!editingGroup && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Étudiants existants</h4>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                   <div className="grid grid-cols-1 gap-2">
                     {availableStudents.map(student => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.email}</p>
                        </div>
                        {selectedStudents.includes(student.id) && (
                          <Badge variant="default" className="bg-indigo-600 text-xs">
                            Sélectionné
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* New Student Creation */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Ajouter un nouvel étudiant</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="studentName">Nom complet</Label>
                  <Input
                    id="studentName"
                    value={currentStudent.name}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom de l'étudiant"
                  />
                </div>
                <div>
                  <Label htmlFor="studentClasse">Classe</Label>
                  <Input
                    id="studentClasse"
                    value={currentStudent.classe}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, classe: e.target.value }))}
                    placeholder="ex: 4ème Maths"
                  />
                </div>
                <div>
                  <Label htmlFor="studentLycee">Lycée</Label>
                  <Input
                    id="studentLycee"
                    value={currentStudent.lycee}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, lycee: e.target.value }))}
                    placeholder="Nom du lycée"
                  />
                </div>
                <div>
                  <Label htmlFor="studentPhone">Téléphone</Label>
                  <Input
                    id="studentPhone"
                    value={currentStudent.phone}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="studentEmail">Email (optionnel)</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={currentStudent.email}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={addNewStudent}
                disabled={!isCurrentStudentValid}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter l'étudiant
              </Button>
            </div>
            
            {/* Selected and New Students Display */}
            {(selectedStudents.length > 0 || newStudents.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Étudiants du groupe</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map(studentId => {
                    const student = availableStudents.find(s => s.id === studentId)
                    return student ? (
                      <Badge key={studentId} variant="secondary" className="flex items-center gap-1">
                        {student.name}
                        <button
                          type="button"
                          onClick={() => toggleStudent(studentId)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                  {newStudents.map((student, index) => (
                    <Badge key={`new-${index}`} variant="default" className="flex items-center gap-1 bg-green-600">
                      {student.name} (nouveau)
                      <button
                        type="button"
                        onClick={() => removeNewStudent(index)}
                        className="ml-1 hover:text-red-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {errors.students && <p className="text-red-500 text-sm">{errors.students}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {editingGroup ? (
                 <>
                   <Edit className="h-4 w-4 mr-2" />
                   Modifier le groupe
                 </>
               ) : (
                 <>
                   <Plus className="h-4 w-4 mr-2" />
                   Créer le groupe
                 </>
               )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}