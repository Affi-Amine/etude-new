'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PaymentDashboard } from '@/components/payments/payment-dashboard'
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
  Filter,
  Download,
  Calendar,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Group {
  id: string
  name: string
  subject: string
  _count: {
    students: number
  }
  sessionFee?: number
  monthlyFee?: number
  pendingAmount?: number
  overdueAmount?: number
  totalRevenue?: number
}

interface PaymentStats {
  totalRevenue: number
  pendingAmount: number
  overdueAmount: number
  totalGroups: number
  activeStudents: number
}

export default function PaiementsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('Fetching payment data...');
      const [groupsResponse, statsResponse] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/payments/global-stats')
      ])
      console.log('API responses:', { groupsOk: groupsResponse.ok, statsOk: statsResponse.ok });

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        
        // Fetch payment stats for each group
        const groupsWithStats = await Promise.all(
          groupsData.map(async (group: Group) => {
            try {
              console.log(`Fetching stats for group ${group.id}...`)
              const statsRes = await fetch(`/api/payments/stats?groupId=${group.id}&period=month`)
              console.log(`Stats response for group ${group.id}:`, { ok: statsRes.ok, status: statsRes.status })
              
              if (statsRes.ok) {
                const groupStats = await statsRes.json()
                console.log(`Group ${group.id} stats:`, groupStats)
                return {
                  ...group,
                  pendingAmount: groupStats.pendingAmount || 0,
                  overdueAmount: groupStats.overdueAmount || 0,
                  totalRevenue: groupStats.totalRevenue || 0
                }
              } else {
                console.error(`Failed to fetch stats for group ${group.id}:`, statsRes.status, statsRes.statusText)
                return {
                  ...group,
                  pendingAmount: 0,
                  overdueAmount: 0,
                  totalRevenue: 0
                }
              }
            } catch (error) {
              console.error(`Error fetching stats for group ${group.id}:`, error)
              return {
                ...group,
                pendingAmount: 0,
                overdueAmount: 0,
                totalRevenue: 0
              }
            }
          })
        )
        
        setGroups(groupsWithStats)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          pendingAmount: statsData.pendingAmount || 0,
          overdueAmount: statsData.overdueAmount || 0,
          totalGroups: statsData.totalGroups || 0,
          activeStudents: statsData.activeStudents || 0
        })
      } else {
        // Fallback stats if API fails
        setStats({
          totalRevenue: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          totalGroups: 0,
          activeStudents: 0
        })
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      // Set default values on error
      setStats({
        totalRevenue: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalGroups: 0,
        activeStudents: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    // For now, we'll show all groups since we don't have payment status per group
    return matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données de paiement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
          <p className="text-gray-600 mt-1">Suivi et gestion des paiements de tous vos groupes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Rapport mensuel
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenus totaux</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En retard</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Groupes actifs</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalGroups}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Étudiants</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeStudents}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Groupes ({filteredGroups.length})</span>
                <Filter className="h-4 w-4" />
              </CardTitle>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un groupe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Tous
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                  >
                    Actifs
                  </Button>
                  <Button
                    variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('overdue')}
                  >
                    En retard
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <Badge variant="outline">
                        {group._count.students} étudiant{group._count.students !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{group.subject}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(group.sessionFee || group.monthlyFee || 0)}/cycle
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGroup(group)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                      </div>
                      {((group.pendingAmount || 0) > 0 || (group.overdueAmount || 0) > 0) ? (
                         <div className="flex items-center justify-between text-xs">
                           {(group.pendingAmount || 0) > 0 && (
                             <span className="text-orange-600 font-medium">
                               En attente: {formatCurrency(group.pendingAmount || 0)}
                             </span>
                           )}
                           {(group.overdueAmount || 0) > 0 && (
                             <span className="text-red-600 font-medium">
                               En retard: {formatCurrency(group.overdueAmount || 0)}
                             </span>
                           )}
                         </div>
                       ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Dashboard */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <PaymentDashboard 
              groupId={selectedGroup.id} 
              groupName={selectedGroup.name}
            />
          ) : (
            <Card className="h-96">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sélectionnez un groupe
                  </h3>
                  <p className="text-gray-600">
                    Choisissez un groupe dans la liste pour voir le tableau de bord des paiements
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}