'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Users, Clock, DollarSign, Calendar, Trash2 } from 'lucide-react'
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
import { NewGroupFormData, WeeklySession, Student, Group } from '@/lib/types'

interface NewGroupCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (groupData: NewGroupFormData) => void
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
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'TUESDAY', label: 'Mardi' },
  { value: 'WEDNESDAY', label: 'Mercredi' },
  { value: 'THURSDAY', label: 'Jeudi' },
  { value: 'FRIDAY', label: 'Vendredi' },
  { value: 'SATURDAY', label: 'Samedi' },
  { value: 'SUNDAY', label: 'Dimanche' }
] as const

const SUBJECTS = [
  'Mathématiques', 'Physique', 'Chimie', 'Français', 'Anglais', 'Arabe',
  'Sciences', 'Histoire', 'Géographie', 'Philosophie', 'Informatique'
]

export default function NewGroupCreationModal({
  isOpen,
  onClose,
  onSubmit,
  availableStudents,
  editingGroup
}: NewGroupCreationModalProps) {
  const [formData, setFormData] = useState<NewGroupFormData>({
    name: '',
    subject: '',
    weeklySchedule: [],
    sessionFee: 0,
    paymentThreshold: 8,
    registrationFee: 0,
    semesterStartDate: new Date(),
    semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    studentIds: []
  })

  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [newStudents, setNewStudents] = useState<NewStudentData[]>([])
  const [currentStudent, setCurrentStudent] = useState<NewStudentData>({
    name: '',
    classe: '',
    lycee: '',
    phone: '',
    email: ''
  })

  const [currentSession, setCurrentSession] = useState<WeeklySession>({
    dayOfWeek: 'MONDAY',
    startTime: '',
    duration: 60
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with editing group data
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        subject: editingGroup.subject,
        weeklySchedule: editingGroup.weeklySchedule ? (typeof editingGroup.weeklySchedule === 'string' ? JSON.parse(editingGroup.weeklySchedule) : editingGroup.weeklySchedule) : [],
        sessionFee: editingGroup.sessionFee || 0,
        paymentThreshold: editingGroup.paymentThreshold || 8,
        registrationFee: editingGroup.registrationFee || 0,
        semesterStartDate: editingGroup.semesterStartDate ? new Date(editingGroup.semesterStartDate) : new Date(),
        semesterEndDate: editingGroup.semesterEndDate ? new Date(editingGroup.semesterEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        studentIds: editingGroup.students?.map((s: any) => s.studentId) || []
      })
      setSelectedStudents(editingGroup.students?.map((s: any) => s.studentId) || [])
    } else {
      // Reset form for new group creation
      setFormData({
        name: '',
        subject: '',
        weeklySchedule: [],
        sessionFee: 0,
        paymentThreshold: 8,
        registrationFee: 0,
        semesterStartDate: new Date(),
        semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        studentIds: []
      })
      setSelectedStudents([])
      setNewStudents([])
    }
  }, [editingGroup])

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.subject.trim() !== '' &&
      formData.weeklySchedule.length > 0 &&
      formData.sessionFee > 0 &&
      formData.paymentThreshold > 0 &&
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

  const isCurrentSessionValid = useMemo(() => {
    return (
      currentSession.startTime !== '' &&
      currentSession.duration > 0 &&
      !formData.weeklySchedule.some(session => 
        session.dayOfWeek === currentSession.dayOfWeek && 
        session.startTime === currentSession.startTime
      )
    )
  }, [currentSession, formData.weeklySchedule])

  const addWeeklySession = () => {
    if (isCurrentSessionValid) {
      setFormData(prev => ({
        ...prev,
        weeklySchedule: [...prev.weeklySchedule, currentSession]
      }))
      setCurrentSession({
        dayOfWeek: 'MONDAY',
        startTime: '',
        duration: 60
      })
    }
  }

  const removeWeeklySession = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter((_, i) => i !== index)
    }))
  }

  const addNewStudent = () => {
    if (isCurrentStudentValid) {
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
    
    // Ensure paymentThreshold is a valid number
    const paymentThreshold = formData.paymentThreshold || 8
    
    const groupData = {
      name: formData.name,
      subject: formData.subject,
      weeklySchedule: formData.weeklySchedule,
      sessionFee: formData.sessionFee,
      paymentThreshold: paymentThreshold,
      registrationFee: formData.registrationFee || 0,
      semesterStartDate: formData.semesterStartDate,
      semesterEndDate: formData.semesterEndDate,
      studentIds: selectedStudents,
      newStudents: newStudents
    }
    
    console.log('Submitting group data:', groupData)
    onSubmit(groupData)
    onClose()
    // Reset form
    setFormData({
      name: '',
      subject: '',
      weeklySchedule: [],
      sessionFee: 0,
      paymentThreshold: 8,
      registrationFee: 0,
      semesterStartDate: new Date(),
      semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
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
    setCurrentSession({
      dayOfWeek: 'MONDAY',
      startTime: '',
      duration: 60
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getDayLabel = (dayOfWeek: WeeklySession['dayOfWeek']) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || dayOfWeek
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingGroup ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingGroup ? 'Modifiez la configuration de votre groupe' : 'Configurez un groupe avec plusieurs sessions hebdomadaires'}
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

          {/* Weekly Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Horaire hebdomadaire
            </h3>
            
            {/* Current Sessions */}
            {formData.weeklySchedule.length > 0 && (
              <div className="space-y-2">
                <Label>Sessions configurées:</Label>
                <div className="space-y-2">
                  {formData.weeklySchedule.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">{getDayLabel(session.dayOfWeek)}</Badge>
                        <span className="text-sm font-medium">{session.startTime}</span>
                        <span className="text-sm text-gray-600">({session.duration} min)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWeeklySession(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Session */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <Label>Ajouter une session:</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="sessionDay">Jour *</Label>
                  <Select
                    value={currentSession.dayOfWeek}
                    onValueChange={(value: WeeklySession['dayOfWeek']) => 
                      setCurrentSession(prev => ({ ...prev, dayOfWeek: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sessionTime">Heure *</Label>
                  <Input
                    id="sessionTime"
                    type="time"
                    value={currentSession.startTime}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionDuration">Durée (min)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    min="30"
                    max="180"
                    step="15"
                    value={currentSession.duration}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addWeeklySession}
                    disabled={!isCurrentSessionValid}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
              Configuration des paiements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sessionFee">Prix par session (DT) *</Label>
                <Input
                  id="sessionFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sessionFee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sessionFee: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="ex: 25.00"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentThreshold">Nombre de sessions par mois *</Label>
                <Input
                  id="paymentThreshold"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.paymentThreshold}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentThreshold: parseInt(e.target.value) || 8
                  }))}
                  placeholder="ex: 8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de sessions dans le mois (= seuil de paiement)
                </p>
              </div>
              
              <div>
                <Label htmlFor="monthlyPrice">Prix mensuel (DT)</Label>
                <div className="relative">
                  <Input
                    id="monthlyPrice"
                    type="text"
                    value={`${(formData.sessionFee * formData.paymentThreshold).toFixed(2)} DT`}
                    disabled
                    className="bg-gray-50 text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calculé automatiquement: {formData.paymentThreshold} sessions × {formData.sessionFee} DT
                </p>
              </div>
              
              <div>
                <Label htmlFor="registrationFee">Frais d'inscription (DT)</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.registrationFee || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    registrationFee: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="ex: 50.00"
                />
              </div>
            </div>
          </div>

          {/* Semester Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" />
              Période du semestre
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="semesterStart">Date de début *</Label>
                <Input
                  id="semesterStart"
                  type="date"
                  value={formatDate(formData.semesterStartDate)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semesterStartDate: new Date(e.target.value)
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="semesterEnd">Date de fin *</Label>
                <Input
                  id="semesterEnd"
                  type="date"
                  value={formatDate(formData.semesterEndDate)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    semesterEndDate: new Date(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Sélection des étudiants
            </h3>
            
            {/* Existing Students */}
            {availableStudents.length > 0 && (
              <div>
                <Label>Étudiants existants:</Label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {availableStudents.map(student => (
                    <div key={student.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`student-${student.id}`} className="flex-1 text-sm">
                        {student.name} - {student.classe} ({student.lycee})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Students */}
            <div className="space-y-4">
              <Label>Ajouter de nouveaux étudiants:</Label>
              
              {/* New Students List */}
              {newStudents.length > 0 && (
                <div className="space-y-2">
                  {newStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <span className="font-medium">{student.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          {student.classe} - {student.lycee}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewStudent(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Student Form */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="ex: Bac Sciences"
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
                </div>
                
                <div>
                  <Label htmlFor="studentEmail">Email (optionnel)</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={currentStudent.email || ''}
                    onChange={(e) => setCurrentStudent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={addNewStudent}
                  disabled={!isCurrentStudentValid}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter l'étudiant
                </Button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
              disabled={!isFormValid}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingGroup ? 'Modifier le groupe' : 'Créer le groupe'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}