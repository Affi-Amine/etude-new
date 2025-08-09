'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, BookOpen, FileText, Target, Package, Home, X, Plus } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { Session } from '@/lib/types'

// Dialog components
const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 max-h-[90vh] w-full max-w-4xl overflow-auto">
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
    {children}
  </div>
)

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    {children}
  </div>
)

const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold ${className}`}>
    {children}
  </h2>
)

// Separator component
const Separator = ({ className = '' }: { className?: string }) => (
  <div className={`border-t border-gray-200 my-4 ${className}`} />
)

interface SessionCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
  onSuccess?: () => void
}

export default function SessionCompletionModal({
  isOpen,
  onClose,
  session,
  onSuccess
}: SessionCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionSummary, setSessionSummary] = useState('')
  const [homework, setHomework] = useState('')
  const [newObjectives, setNewObjectives] = useState<string[]>([])
  const [newMaterials, setNewMaterials] = useState<string[]>([])
  const [newObjective, setNewObjective] = useState('')
  const [newMaterial, setNewMaterial] = useState('')

  const handleClose = () => {
    setSessionSummary('')
    setHomework('')
    setNewObjectives([])
    setNewMaterials([])
    setNewObjective('')
    setNewMaterial('')
    onClose()
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setNewObjectives([...newObjectives, newObjective.trim()])
      setNewObjective('')
    }
  }

  const removeObjective = (index: number) => {
    setNewObjectives(newObjectives.filter((_, i) => i !== index))
  }

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setNewMaterials([...newMaterials, newMaterial.trim()])
      setNewMaterial('')
    }
  }

  const removeMaterial = (index: number) => {
    setNewMaterials(newMaterials.filter((_, i) => i !== index))
  }

  const handleComplete = async () => {
    if (!session) return

    setIsSubmitting(true)
    try {
      // Update session status to completed
      const sessionResponse = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          notes: sessionSummary || session.notes
        }),
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to update session status')
      }

      // Update session content if there are changes
      const hasContentChanges = sessionSummary || homework || newObjectives.length > 0 || newMaterials.length > 0
      
      if (hasContentChanges) {
        const contentData: any = {}
        
        if (sessionSummary) {
          contentData.description = sessionSummary
        }
        
        if (homework) {
          contentData.homework = homework
        }
        
        if (newObjectives.length > 0) {
          contentData.objectives = [...(session.objectives || []), ...newObjectives]
        }
        
        if (newMaterials.length > 0) {
          contentData.materials = [...(session.materials || []), ...newMaterials]
        }

        const contentResponse = await fetch(`/api/sessions/${session.id}/content`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contentData),
        })

        if (!contentResponse.ok) {
          throw new Error('Failed to update session content')
        }
      }

      toast.success('Session marquée comme terminée avec succès!')
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error completing session:', error)
      toast.error('Erreur lors de la finalisation de la session')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) return null

  const hasAttendance = session.attendance && session.attendance.length > 0
  const presentStudents = session.attendance?.filter(a => a.present).length || 0
  const totalStudents = session.attendance?.length || session.group._count?.students || 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finaliser la session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{session.group.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(session.date).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {session.group.subject}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {hasAttendance ? `${presentStudents}/${totalStudents} présents` : `${totalStudents} étudiants`}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {session.duration || session.group.scheduleDuration || 60} min
              </div>
            </div>
          </div>

          {/* Current Content Preview */}
          {(session.title || session.description || session.objectives?.length || session.materials?.length) && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Contenu actuel de la session</h4>
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                {session.title && (
                  <div>
                    <Label className="text-sm font-medium text-blue-900">Titre</Label>
                    <p className="text-sm text-blue-800">{session.title}</p>
                  </div>
                )}
                {session.description && (
                  <div>
                    <Label className="text-sm font-medium text-blue-900">Description</Label>
                    <p className="text-sm text-blue-800">{session.description}</p>
                  </div>
                )}
                {session.objectives && session.objectives.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-blue-900">Objectifs ({session.objectives.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.objectives.map((objective, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {objective}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {session.materials && session.materials.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-blue-900">Matériel ({session.materials.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.materials.map((material, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Session Summary */}
          <div className="space-y-3">
            <Label htmlFor="summary" className="text-base font-medium">Résumé de la session</Label>
            <Textarea
              id="summary"
              placeholder="Décrivez ce qui s'est passé pendant cette session, les points clés abordés, les difficultés rencontrées..."
              value={sessionSummary}
              onChange={(e) => setSessionSummary(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Homework Assignment */}
          <div className="space-y-3">
            <Label htmlFor="homework" className="text-base font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Devoirs à donner
            </Label>
            <Textarea
              id="homework"
              placeholder="Décrivez les devoirs ou exercices à faire pour la prochaine session..."
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Additional Objectives */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objectifs supplémentaires atteints
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un objectif atteint..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button type="button" onClick={addObjective} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {newObjectives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newObjectives.map((objective, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {objective}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Additional Materials */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Matériel supplémentaire utilisé
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter du matériel utilisé..."
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
              />
              <Button type="button" onClick={addMaterial} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {newMaterials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newMaterials.map((material, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {material}
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? 'Finalisation...' : 'Marquer comme terminée'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}