'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Plus, User, Mail, Phone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Student, Group } from '@/lib/types'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  onAddStudents: (studentIds: string[]) => void
  onCreateStudent?: (studentData: Omit<Student, 'id'>) => void
}

export default function AddStudentModal({
  isOpen,
  onClose,
  group,
  onAddStudents,
  onCreateStudent
}: AddStudentModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    classe: '',
    lycee: ''
  })

  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/students');
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        setStudents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Filter available students (not already in the group)
  const availableStudents = useMemo(() => {
    if (!students) return [];
    const groupStudentIds = group.students?.map(gs => gs.studentId) || [];
    return students.filter(student => 
      !groupStudentIds.includes(student.id) &&
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [group.students, searchTerm, students]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleAddSelectedStudents = () => {
    if (selectedStudents.length > 0) {
      onAddStudents(selectedStudents)
      setSelectedStudents([])
      onClose()
    }
  }

  const handleCreateStudent = () => {
    if (newStudentData.name && newStudentData.email) {
      // Call the API to create a new student
      fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStudentData.name,
          email: newStudentData.email,
          phone: newStudentData.phone,
          classe: newStudentData.classe,
          lycee: newStudentData.lycee,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error('Error creating student:', data.error);
            // Handle error, e.g., show a toast notification
          } else {
            console.log('Student created:', data);
            onCreateStudent?.(data); // Pass the newly created student data back
            setNewStudentData({
              name: '',
              email: '',
              phone: '',
              classe: '',
              lycee: ''
            });
            setShowCreateForm(false);
            onClose();
          }
        })
        .catch(error => {
          console.error('Network error creating student:', error);
          // Handle network error
        });
    }
  }

  const resetForm = () => {
    setSearchTerm('')
    setSelectedStudents([])
    setShowCreateForm(false)
    setNewStudentData({
      name: '',
      email: '',
      phone: '',
      classe: '',
      lycee: ''
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Ajouter des étudiants</h2>
            <p className="text-indigo-100 mt-1">Groupe: {group.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showCreateForm ? (
            <div className="space-y-6">
              {/* Search and Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher des étudiants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel étudiant
                </Button>
              </div>

              {/* Selected Students Summary */}
              {selectedStudents.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-indigo-900">
                        {selectedStudents.length} étudiant(s) sélectionné(s)
                      </p>
                      <p className="text-sm text-indigo-700">
                        Cliquez sur "Ajouter les étudiants" pour les ajouter au groupe
                      </p>
                    </div>
                    <Button
                      onClick={handleAddSelectedStudents}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Ajouter les étudiants
                    </Button>
                  </div>
                </div>
              )}

              {/* Available Students List */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  Étudiants disponibles ({availableStudents.length})
                </h3>
                
                {availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      {searchTerm 
                        ? 'Aucun étudiant trouvé pour cette recherche'
                        : 'Tous les étudiants sont déjà dans ce groupe'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStudents.map(student => {
                      const isSelected = selectedStudents.includes(student.id)
                      return (
                        <Card
                          key={student.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected 
                              ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleStudentToggle(student.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white' 
                                      : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {isSelected ? (
                                      <Check className="h-5 w-5" />
                                    ) : (
                                      <User className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <Mail className="h-3 w-3 mr-1" />
                                        {student.email}
                                      </div>
                                      {student.phone && (
                                        <div className="flex items-center">
                                          <Phone className="h-3 w-3 mr-1" />
                                          {student.phone}
                                        </div>
                                      )}
                                    </div>
                                    {/* Parent information not available in current Student type */}
                                  </div>
                                </div>
                              </div>
                              
                              <Badge 
                                className={isSelected 
                                  ? 'bg-indigo-100 text-indigo-800' 
                                  : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {isSelected ? 'Sélectionné' : 'Disponible'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Create New Student Form */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Créer un nouvel étudiant</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-600"
                >
                  Retour à la liste
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet *
                    </label>
                    <Input
                      value={newStudentData.name}
                      onChange={(e) => setNewStudentData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom de l'étudiant"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={newStudentData.email}
                      onChange={(e) => setNewStudentData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemple.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone de l'étudiant
                    </label>
                    <Input
                      value={newStudentData.phone}
                      onChange={(e) => setNewStudentData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classe
                    </label>
                    <Input
                      value={newStudentData.classe}
                      onChange={(e) => setNewStudentData(prev => ({ ...prev, classe: e.target.value }))}
                      placeholder="Terminale S"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lycée
                  </label>
                  <Input
                    value={newStudentData.lycee}
                    onChange={(e) => setNewStudentData(prev => ({ ...prev, lycee: e.target.value }))}
                    placeholder="Lycée Victor Hugo"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateStudent}
                    disabled={!newStudentData.name || !newStudentData.email}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer et ajouter au groupe
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}