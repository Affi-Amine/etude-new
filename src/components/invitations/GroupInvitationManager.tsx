'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { 
  QrCode, 
  Copy, 
  Share2, 
  Users, 
  Clock, 
  Plus, 
  Loader2, 
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface GroupInvitation {
  id: string
  code: string
  qrCode: string
  joinUrl: string
  maxUses: number
  currentUses: number
  expiresAt: string
  createdAt: string
  group: {
    name: string
    subject: string
  }
}

interface GroupInvitationManagerProps {
  groupId: string
  groupName: string
}

export default function GroupInvitationManager({ groupId, groupName }: GroupInvitationManagerProps) {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    maxUses: 50,
    expiresInDays: 7
  })

  useEffect(() => {
    loadInvitations()
  }, [groupId])

  const loadInvitations = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`)
      const data = await response.json()

      if (data.success) {
        setInvitations(data.invitations)
      } else {
        setError(data.error || 'Erreur lors du chargement des invitations')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const createInvitation = async () => {
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setInvitations([data.invitation, ...invitations])
        setShowCreateDialog(false)
        toast.success('Code d\'invitation créé avec succès!')
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copié dans le presse-papiers!`)
    } catch (err) {
      toast.error('Erreur lors de la copie')
    }
  }

  const shareInvitation = async (invitation: GroupInvitation) => {
    const shareText = `Rejoignez le groupe "${invitation.group.name}" (${invitation.group.subject})\n\nCode d'invitation: ${invitation.code}\nOu cliquez sur ce lien: ${invitation.joinUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invitation - ${invitation.group.name}`,
          text: shareText,
          url: invitation.joinUrl
        })
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(shareText, 'Invitation')
      }
    } else {
      copyToClipboard(shareText, 'Invitation')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des invitations...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invitations pour {groupName}</h3>
          <p className="text-sm text-gray-600">Gérez les codes d'invitation pour ce groupe</p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une invitation
        </Button>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-xl font-semibold">Créer un code d'invitation</DialogTitle>
              <p className="text-sm text-gray-600 mt-3">
                Générez un nouveau code d'invitation pour permettre aux étudiants de rejoindre ce groupe.
              </p>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-sm font-medium">Nombre maximum d'utilisations</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiresInDays" className="text-sm font-medium">Expire dans (jours)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="pt-4">
                <Button 
                  onClick={createInvitation} 
                  disabled={creating}
                  className="w-full h-11"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer l\'invitation'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune invitation active</h3>
            <p className="text-gray-600 mb-4">Créez votre première invitation pour permettre aux étudiants de rejoindre ce groupe.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une invitation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className={isExpired(invitation.expiresAt) ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      Code: {invitation.code}
                      {isExpired(invitation.expiresAt) ? (
                        <Badge variant="destructive" className="ml-2">Expiré</Badge>
                      ) : (
                        <Badge variant="default" className="ml-2">Actif</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Créé le {formatDate(invitation.createdAt)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(invitation.code, 'Code')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareInvitation(invitation)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Utilisations: {invitation.currentUses}/{invitation.maxUses}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Expire le: {formatDate(invitation.expiresAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invitation.joinUrl, 'Lien')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier le lien
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invitation.joinUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded border">
                      <img 
                        src={invitation.qrCode} 
                        alt={`QR Code pour ${invitation.code}`}
                        className="w-24 h-24"
                      />
                      <p className="text-xs text-center mt-1 text-gray-600">QR Code</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}