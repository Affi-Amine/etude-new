'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, BookOpen, Target, Package, Home, FileText, Upload,
  Plus, Trash2, ExternalLink, Save, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import type { Group, Session } from '@/lib/types'

interface CourseContentModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  session?: Session
}

interface CourseContent {
  title?: string
  description?: string
  objectives?: string[]
  materials?: string[]
  homework?: string
  resources?: {
    type: 'file' | 'link' | 'document'
    name: string
    url: string
    size?: number
  }[]
}

export default function CourseContentModal({
  isOpen,
  onClose,
  group,
  session
}: CourseContentModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [content, setContent] = useState<CourseContent>({
    title: '',
    description: '',
    objectives: [],
    materials: [],
    homework: '',
    resources: []
  })
  const [newObjective, setNewObjective] = useState('')
  const [newMaterial, setNewMaterial] = useState('')
  const [newResource, setNewResource] = useState({
    type: 'link' as const,
    name: '',
    url: ''
  })

  useEffect(() => {
    if (group && isOpen) {
      loadGroupSessions()
    }
  }, [group, isOpen])

  useEffect(() => {
    if (session) {
      setSelectedSessionId(session.id)
      loadSessionContent(session.id)
    }
  }, [session])

  const loadGroupSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions?groupId=${group.id}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error('Erreur', 'Impossible de charger les sessions')
    } finally {
      setLoading(false)
    }
  }

  const loadSessionContent = async (sessionId: string) => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/content`)
      if (response.ok) {
        const data = await response.json()
        setContent({
          title: data.title || '',
          description: data.description || '',
          objectives: data.objectives || [],
          materials: data.materials || [],
          homework: data.homework || '',
          resources: data.resources || []
        })
      }
    } catch (error) {
      console.error('Error loading session content:', error)
    }
  }

  const saveContent = async () => {
    if (!selectedSessionId) {
      toast.error('Erreur', 'Veuillez sélectionner une session')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/sessions/${selectedSessionId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      })

      if (response.ok) {
        toast.success('Succès', 'Contenu sauvegardé avec succès')
        onClose()
      } else {
        throw new Error('Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Erreur', 'Impossible de sauvegarder le contenu')
    } finally {
      setSaving(false)
    }
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setContent(prev => ({
        ...prev,
        objectives: [...(prev.objectives || []), newObjective.trim()]
      }))
      setNewObjective('')
    }
  }

  const removeObjective = (index: number) => {
    setContent(prev => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== index) || []
    }))
  }

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setContent(prev => ({
        ...prev,
        materials: [...(prev.materials || []), newMaterial.trim()]
      }))
      setNewMaterial('')
    }
  }

  const removeMaterial = (index: number) => {
    setContent(prev => ({
      ...prev,
      materials: prev.materials?.filter((_, i) => i !== index) || []
    }))
  }

  const addResource = () => {
    if (newResource.name.trim() && newResource.url.trim()) {
      setContent(prev => ({
        ...prev,
        resources: [...(prev.resources || []), { ...newResource }]
      }))
      setNewResource({ type: 'link', name: '', url: '' })
    }
  }

  const removeResource = (index: number) => {
    setContent(prev => ({
      ...prev,
      resources: prev.resources?.filter((_, i) => i !== index) || []
    }))
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file': return Upload
      case 'link': return ExternalLink
      case 'document': return FileText
      default: return FileText
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              Contenu du Cours
            </h2>
            <p className="text-gray-600 mt-1">
              {group.name} - {group.subject}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une session
                </label>
                <Select
                  value={selectedSessionId}
                  onValueChange={(value) => {
                    setSelectedSessionId(value)
                    loadSessionContent(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        Session du {new Date(session.date).toLocaleDateString('fr-FR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSessionId && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du cours
                    </label>
                    <Input
                      value={content.title || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Introduction aux fonctions mathématiques"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={content.description || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez le contenu de cette session..."
                      rows={3}
                    />
                  </div>

                  {/* Objectives */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      Objectifs pédagogiques
                    </label>
                    <div className="space-y-2">
                      {content.objectives?.map((objective, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1">{objective}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newObjective}
                          onChange={(e) => setNewObjective(e.target.value)}
                          placeholder="Ajouter un objectif..."
                          onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                        />
                        <Button onClick={addObjective} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Matériel utilisé
                    </label>
                    <div className="space-y-2">
                      {content.materials?.map((material, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1">{material}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newMaterial}
                          onChange={(e) => setNewMaterial(e.target.value)}
                          placeholder="Ajouter du matériel..."
                          onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
                        />
                        <Button onClick={addMaterial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Ressources
                    </label>
                    <div className="space-y-2">
                      {content.resources?.map((resource, index) => {
                        const Icon = getResourceIcon(resource.type)
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{resource.name}</p>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {resource.url}
                              </a>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResource(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                      <Card>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select
                              value={newResource.type}
                              onValueChange={(value: 'file' | 'link' | 'document') => 
                                setNewResource(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="link">Lien</SelectItem>
                                <SelectItem value="file">Fichier</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={newResource.name}
                              onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Nom de la ressource"
                            />
                            <Input
                              value={newResource.url}
                              onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                              placeholder="URL de la ressource"
                            />
                          </div>
                          <Button onClick={addResource} size="sm" className="mt-3">
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter la ressource
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Homework */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4 text-orange-600" />
                      Devoirs à donner
                    </label>
                    <Textarea
                      value={content.homework || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, homework: e.target.value }))}
                      placeholder="Décrivez les devoirs à donner aux étudiants..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={saveContent} 
            disabled={!selectedSessionId || saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}