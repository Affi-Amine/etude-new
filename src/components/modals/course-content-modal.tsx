'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, Plus, Trash2, Upload, Link, FileText, Save, Loader2,
  BookOpen, Target, Package, Home, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { Session } from '@/lib/types'

interface CourseContentModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
  onSave?: (sessionId: string) => void
}

interface Resource {
  id?: string
  type: 'file' | 'link' | 'document'
  name: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt?: string
  uploadedBy?: string
}

export default function CourseContentModal({
  isOpen,
  onClose,
  session,
  onSave
}: CourseContentModalProps) {
  // Using toast directly
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState<string[]>([''])
  const [materials, setMaterials] = useState<string[]>([''])
  const [homework, setHomework] = useState('')
  const [resources, setResources] = useState<Resource[]>([])
  
  // New resource form
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    type: 'link',
    name: '',
    url: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load existing content when session changes
  useEffect(() => {
    if (session && isOpen) {
      loadSessionContent()
    }
  }, [session, isOpen])

  const loadSessionContent = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/content`)
      if (response.ok) {
        const data = await response.json()
        setTitle(data.title || '')
        setDescription(data.description || '')
        setObjectives(data.objectives?.length > 0 ? data.objectives : [''])
        setMaterials(data.materials?.length > 0 ? data.materials : [''])
        setHomework(data.homework || '')
        setResources(data.resources || [])
      }
    } catch (error) {
      console.error('Error loading session content:', error)
      toast.error('Erreur', 'Impossible de charger le contenu de la session')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!session) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim() || null,
          description: description.trim() || null,
          objectives: objectives.filter(obj => obj.trim()).length > 0 ? objectives.filter(obj => obj.trim()) : null,
          materials: materials.filter(mat => mat.trim()).length > 0 ? materials.filter(mat => mat.trim()) : null,
          homework: homework.trim() || null,
          resources: resources.length > 0 ? resources : null
        })
      })

      if (response.ok) {
        toast.success('Succès', 'Contenu de la session sauvegardé')
        onSave?.(session.id)
        onClose()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving session content:', error)
      toast.error('Erreur', 'Impossible de sauvegarder le contenu')
    } finally {
      setSaving(false)
    }
  }

  const addObjective = () => {
    setObjectives([...objectives, ''])
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives]
    updated[index] = value
    setObjectives(updated)
  }

  const addMaterial = () => {
    setMaterials([...materials, ''])
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, value: string) => {
    const updated = [...materials]
    updated[index] = value
    setMaterials(updated)
  }

  const addResource = () => {
    if (newResource.name && newResource.url) {
      setResources([...resources, newResource as Resource])
      setNewResource({ type: 'link', name: '', url: '' })
    }
  }

  const removeResource = async (index: number) => {
    const resource = resources[index]
    
    // If it's a file resource with an ID, delete from server
    if (resource.type === 'file' && resource.id && session) {
      try {
        const response = await fetch(`/api/sessions/${session.id}/content/attachments?resourceId=${resource.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete file')
        }
        
        toast.success('Succès', 'Fichier supprimé')
      } catch (error) {
        console.error('Error deleting file:', error)
        toast.error('Erreur', 'Impossible de supprimer le fichier')
        return
      }
    }
    
    setResources(resources.filter((_, i) => i !== index))
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !session) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch(`/api/sessions/${session.id}/content/attachments`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const result = await response.json()
      setResources([...resources, result.resource])
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      toast.success('Succès', 'Fichier uploadé avec succès')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Erreur', error instanceof Error ? error.message : 'Impossible d\'uploader le fichier')
    } finally {
      setUploading(false)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file': return Upload
      case 'link': return ExternalLink
      case 'document': return FileText
      default: return FileText
    }
  }

  if (!isOpen || !session) return null

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
              {session.group?.name} - {formatDate(session.date)}
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la session
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Introduction aux équations du second degré"
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le contenu de cette session..."
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Objectives */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-green-600" />
                    Objectifs d'apprentissage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder="Ex: Comprendre la forme canonique"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeObjective(index)}
                        disabled={objectives.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addObjective}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un objectif
                  </Button>
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                    Matériel nécessaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {materials.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={material}
                        onChange={(e) => updateMaterial(index, e.target.value)}
                        placeholder="Ex: Calculatrice, cahier d'exercices"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                        disabled={materials.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMaterial}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter du matériel
                  </Button>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Ressources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing resources */}
                  {resources.map((resource, index) => {
                    const Icon = getResourceIcon(resource.type)
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{resource.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {resource.type === 'file' ? (
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 underline"
                              >
                                Télécharger
                              </a>
                            ) : (
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 underline truncate"
                              >
                                {resource.url}
                              </a>
                            )}
                            {resource.size && (
                              <span className="text-xs text-gray-500">
                                ({(resource.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">{resource.type}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeResource(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}

                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Uploader un fichier
                    </h4>
                    <div className="space-y-3">
                      <input
                        id="file-upload"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {selectedFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{selectedFile.name}</span>
                          <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
                      </Button>
                    </div>
                  </div>

                  {/* Add new link/document resource */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Ajouter un lien ou document
                    </h4>
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
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={newResource.name || ''}
                        onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom de la ressource"
                      />
                      <Input
                        value={newResource.url || ''}
                        onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="URL ou chemin"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addResource}
                      disabled={!newResource.name || !newResource.url}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter la ressource
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Homework */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4 text-orange-600" />
                  Devoirs à la maison
                </label>
                <Textarea
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  placeholder="Décrivez les devoirs à faire pour la prochaine session..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </motion.div>
    </div>
  )
}