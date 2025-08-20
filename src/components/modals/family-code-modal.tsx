'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Copy,
  RefreshCw,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ParentConnection {
  id: string
  relationship: string
  createdAt: string
  parent: {
    id: string
    name: string
    email: string
    phone: string
  }
}

interface FamilyCodeModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  currentFamilyCode?: string | null
  onCodeUpdate?: (code: string) => void
}

export function FamilyCodeModal({ isOpen, onClose, studentId, currentFamilyCode, onCodeUpdate }: FamilyCodeModalProps) {
  const [familyCode, setFamilyCode] = useState<string | null>(null)
  const [connections, setConnections] = useState<ParentConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    if (isOpen && studentId) {
      fetchFamilyData()
    }
  }, [isOpen, studentId])

  useEffect(() => {
    if (currentFamilyCode) {
      setFamilyCode(currentFamilyCode)
    }
  }, [currentFamilyCode])

  const fetchFamilyData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/student/family-code?studentId=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setFamilyCode(data.familyCode)
        setConnections(data.connections || [])
      }
    } catch (err) {
      console.error('Error fetching family data:', err)
      toast.error('Erreur lors du chargement des données familiales')
    } finally {
      setLoading(false)
    }
  }

  const generateFamilyCode = async () => {
    setGeneratingCode(true)
    try {
      const response = await fetch('/api/student/family-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      })

      if (response.ok) {
        const data = await response.json()
        setFamilyCode(data.familyCode)
        onCodeUpdate?.(data.familyCode)
        toast.success('Code famille généré avec succès!')
      } else {
        toast.error('Erreur lors de la génération du code')
      }
    } catch (err) {
      console.error('Error generating family code:', err)
      toast.error('Erreur lors de la génération du code')
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Code copié dans le presse-papiers!')
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      toast.error('Erreur lors de la copie')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      parent: 'Parent',
      guardian: 'Tuteur',
      tutor: 'Tuteur',
      other: 'Autre'
    }
    return labels[relationship] || relationship
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion du Code Famille
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Family Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Code Famille
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyCode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Votre code famille</p>
                      <p className="text-2xl font-mono font-bold text-blue-900">{familyCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(familyCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateFamilyCode}
                        disabled={generatingCode}
                      >
                        {generatingCode ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Partagez ce code avec vos parents pour qu'ils puissent créer leur compte et suivre vos progrès.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">Aucun code famille généré</p>
                  <Button onClick={generateFamilyCode} disabled={generatingCode}>
                    {generatingCode ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Générer un code famille
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Parents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Parents Connectés ({connections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{connection.parent.name}</h4>
                            <Badge variant="secondary">
                              {getRelationshipLabel(connection.relationship)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {connection.parent.email}
                            </div>
                            {connection.parent.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {connection.parent.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Connecté le {formatDate(connection.createdAt)}
                            </div>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun parent connecté</p>
                  <p className="text-sm mt-1">
                    Générez un code famille et partagez-le avec vos parents
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Comment ça marche ?</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. Générez votre code famille unique</p>
                <p>2. Partagez ce code avec vos parents</p>
                <p>3. Vos parents utilisent ce code pour créer leur compte</p>
                <p>4. Une fois connectés, ils peuvent suivre vos progrès</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}