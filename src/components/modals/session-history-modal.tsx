'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X, Calendar, Clock, Users, BookOpen, Target, Package, Home,
  ExternalLink, FileText, Upload, ChevronDown, ChevronRight,
  Search, Filter, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Collapsible components - using manual state management
import { toast } from '@/components/ui/toast'
import { formatDate, formatTime } from '@/lib/utils'
import type { Group } from '@/lib/types'

interface SessionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group | null
}

interface SessionWithContent {
  id: string
  date: string
  duration: number
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
  notes?: string
  attendanceRate: number
  totalStudents: number
  presentStudents: number
  createdAt: string
  updatedAt: string
}

interface SessionHistoryData {
  group: {
    id: string
    name: string
    subject: string
  }
  sessions: SessionWithContent[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function SessionHistoryModal({
  isOpen,
  onClose,
  group
}: SessionHistoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [historyData, setHistoryData] = useState<SessionHistoryData | null>(null)

  useEffect(() => {
    if (group && isOpen) {
      loadSessionHistory()
    }
  }, [group, isOpen])

  const loadSessionHistory = async () => {
    if (!group) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/session-history?limit=50`)
      if (response.ok) {
        const data = await response.json()
        setHistoryData(data)
      } else {
        throw new Error('Failed to load session history')
      }
    } catch (error) {
      console.error('Error loading session history:', error)
      toast.error('Erreur', 'Impossible de charger l\'historique des sessions')
    } finally {
      setLoading(false)
    }
  }

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const filteredSessions = historyData?.sessions.filter(session => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      session.title?.toLowerCase().includes(searchLower) ||
      session.description?.toLowerCase().includes(searchLower) ||
      session.objectives?.some(obj => obj.toLowerCase().includes(searchLower)) ||
      session.materials?.some(mat => mat.toLowerCase().includes(searchLower)) ||
      session.homework?.toLowerCase().includes(searchLower)
    )
  }) || []

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file': return Upload
      case 'link': return ExternalLink
      case 'document': return FileText
      default: return FileText
    }
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (!isOpen || !group) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              Historique des Sessions
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

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucune session terminée'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Les sessions terminées apparaîtront ici avec leur contenu'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Sessions</p>
                        <p className="text-xl font-bold">{historyData?.pagination.total || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Taux de Présence Moyen</p>
                        <p className="text-xl font-bold">
                          {filteredSessions.length > 0 
                            ? Math.round(filteredSessions.reduce((sum, s) => sum + s.attendanceRate, 0) / filteredSessions.length)
                            : 0
                          }%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Sessions avec Contenu</p>
                        <p className="text-xl font-bold">
                          {filteredSessions.filter(s => s.title || s.description || s.objectives?.length).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sessions List */}
              {filteredSessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id)
                const hasContent = session.title || session.description || 
                                 session.objectives?.length || session.materials?.length || 
                                 session.homework || session.resources?.length

                return (
                  <Card key={session.id} className="border-0 shadow-md">
                    <div>
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSessionExpansion(session.id)}
                      >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                              <div>
                                <CardTitle className="text-lg">
                                  {session.title || `Session du ${formatDate(new Date(session.date))}`}
                                </CardTitle>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(new Date(session.date))}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {session.duration} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {session.presentStudents}/{session.totalStudents}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={`${getAttendanceColor(session.attendanceRate)} border-0`}
                              >
                                {session.attendanceRate}% présence
                              </Badge>
                              {hasContent && (
                                <Badge variant="secondary">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Contenu
                                </Badge>
                              )}
                            </div>
                          </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0">
                          {hasContent ? (
                            <div className="space-y-4">
                              {session.description && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                  <p className="text-gray-700">{session.description}</p>
                                </div>
                              )}
                              
                              {session.objectives && session.objectives.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-green-600" />
                                    Objectifs
                                  </h4>
                                  <ul className="list-disc list-inside space-y-1">
                                    {session.objectives.map((objective, index) => (
                                      <li key={index} className="text-gray-700">{objective}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {session.materials && session.materials.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    Matériel utilisé
                                  </h4>
                                  <ul className="list-disc list-inside space-y-1">
                                    {session.materials.map((material, index) => (
                                      <li key={index} className="text-gray-700">{material}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {session.resources && session.resources.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    Ressources
                                  </h4>
                                  <div className="space-y-2">
                                    {session.resources.map((resource, index) => {
                                      const Icon = getResourceIcon(resource.type)
                                      return (
                                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
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
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {session.homework && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Home className="h-4 w-4 text-orange-600" />
                                    Devoirs donnés
                                  </h4>
                                  <p className="text-gray-700">{session.homework}</p>
                                </div>
                              )}
                              
                              {session.notes && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                                  <p className="text-gray-700">{session.notes}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Aucun contenu ajouté pour cette session</p>
                          )}
                        </CardContent>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </motion.div>
    </div>
  )
}