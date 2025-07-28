'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Progress component will be defined inline
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Download,
  Bell
} from 'lucide-react'

interface PaymentStats {
  totalRevenue: number
  pendingAmount: number
  overdueAmount: number
  collectionRate: number
  totalStudents: number
  payingStudents: number
  studentsUpToDate: number
  studentsWithOverdue: number
  studentsWithPending: number
}

interface PaymentSummary {
  studentId: string
  studentName: string
  totalDue: number
  totalPaid: number
  overdueAmount: number
  nextDueDate?: string
  status: 'UP_TO_DATE' | 'PENDING' | 'OVERDUE'
  lastPaymentDate?: string
  attendedSessions: number
  sessionsInCurrentCycle: number
}

interface PaymentDashboardProps {
  groupId: string
  groupName: string
}

export function PaymentDashboard({ groupId, groupName }: PaymentDashboardProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [summaries, setSummaries] = useState<PaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchPaymentData()
  }, [groupId, selectedPeriod])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      const [statsResponse, summariesResponse] = await Promise.all([
        fetch(`/api/payments/stats?groupId=${groupId}&period=${selectedPeriod}`),
        fetch(`/api/payments/summaries?groupId=${groupId}`)
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        // Ensure all numeric values are properly set
        setStats({
          ...statsData,
          totalRevenue: statsData.totalRevenue || 0,
          pendingAmount: statsData.pendingAmount || 0,
          overdueAmount: statsData.overdueAmount || 0,
          collectionRate: statsData.collectionRate || 0,
          totalStudents: statsData.totalStudents || 0,
          payingStudents: statsData.payingStudents || 0,
          studentsUpToDate: statsData.studentsUpToDate || 0,
          studentsWithOverdue: statsData.studentsWithOverdue || 0,
          studentsWithPending: statsData.studentsWithPending || 0,
        })
      }

      if (summariesResponse.ok) {
        const summariesData = await summariesResponse.json()
        setSummaries(summariesData || [])
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      // Set default values on error
      setStats({
        totalRevenue: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        collectionRate: 0,
        totalStudents: 0,
        payingStudents: 0,
        studentsUpToDate: 0,
        studentsWithOverdue: 0,
        studentsWithPending: 0,
      })
      setSummaries([])
    } finally {
      setLoading(false)
    }
  }

  const generateRecurringPayments = async () => {
    try {
      const response = await fetch(`/api/payments/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        alert('Paiements générés avec succès!');
        fetchPaymentData(); // Refresh data
      } else {
        alert('Erreur lors de la génération des paiements');
      }
    } catch (error) {
      console.error('Error generating payments:', error);
      alert('Erreur lors de la génération des paiements');
    }
  }

  const sendPaymentReminders = async () => {
    try {
      const response = await fetch(`/api/payments/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        alert('Rappels envoyés avec succès!');
      } else {
        alert('Erreur lors de l\'envoi des rappels');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Erreur lors de l\'envoi des rappels');
    }
  }

  const exportPaymentData = () => {
    // Create CSV data
    const csvData = [
      ['Nom', 'Statut', 'Total Dû', 'Total Payé', 'En Retard', 'Sessions Présentes', 'Prochaine Échéance'],
      ...summaries.map(summary => [
        summary.studentName,
        summary.status,
        `${summary.totalDue} DT`,
        `${summary.totalPaid} DT`,
        `${summary.overdueAmount} DT`,
        `${summary.attendedSessions}`,
        summary.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString('fr-FR') : 'N/A'
      ])
    ];

    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paiements_${groupName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getStatusColor = (status: PaymentSummary['status']) => {
    switch (status) {
      case 'UP_TO_DATE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: PaymentSummary['status']) => {
    switch (status) {
      case 'UP_TO_DATE': return <CheckCircle className="h-4 w-4" />
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'OVERDUE': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord des paiements</h2>
          <p className="text-gray-600">{groupName}</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <Button variant="outline" size="sm" onClick={generateRecurringPayments}>
            <Plus className="h-4 w-4 mr-1" />
            Générer paiements
          </Button>
          <Button variant="outline" size="sm" onClick={sendPaymentReminders}>
            <Bell className="h-4 w-4 mr-1" />
            Rappels
          </Button>
          <Button variant="outline" size="sm" onClick={exportPaymentData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue} DT</div>
              <p className="text-xs text-muted-foreground">
                +{stats.totalRevenue + stats.pendingAmount > 0 ? ((stats.totalRevenue / (stats.totalRevenue + stats.pendingAmount)) * 100).toFixed(1) : '0'}% collecté
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAmount} DT</div>
              <p className="text-xs text-muted-foreground">
                {stats.studentsWithPending || 0} étudiants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueAmount} DT</div>
              <p className="text-xs text-muted-foreground">
                Nécessite un suivi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de collecte</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isNaN(stats.collectionRate) ? '0' : stats.collectionRate.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${isNaN(stats.collectionRate) ? 0 : stats.collectionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Payment Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Suivi par étudiant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summaries.map((summary) => (
              <div key={summary.studentId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{summary.studentName}</h4>
                    <Badge className={getStatusColor(summary.status)}>
                      {getStatusIcon(summary.status)}
                      <span className="ml-1">
                        {summary.status === 'UP_TO_DATE' ? 'À jour' :
                         summary.status === 'PENDING' ? 'En attente' : 'En retard'}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Présences:</span>
                      <p>{summary.attendedSessions || 0} sessions</p>
                    </div>
                    <div>
                      <span className="font-medium">Cycle actuel:</span>
                      <p>{summary.sessionsInCurrentCycle || 0} sessions</p>
                    </div>
                    <div>
                      <span className="font-medium">Total dû:</span>
                      <p>{summary.totalDue} DT</p>
                    </div>
                    <div>
                      <span className="font-medium">Payé:</span>
                      <p className="text-green-600">{summary.totalPaid} DT</p>
                    </div>
                    {summary.overdueAmount > 0 && (
                      <div>
                        <span className="font-medium">En retard:</span>
                        <p className="text-red-600">{summary.overdueAmount} DT</p>
                      </div>
                    )}
                    {summary.nextDueDate && (
                      <div>
                        <span className="font-medium">Prochaine échéance:</span>
                        <p>{new Date(summary.nextDueDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                  </div>
                  
                  {summary.lastPaymentDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dernier paiement: {new Date(summary.lastPaymentDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {summary.totalDue > 0 ? ((summary.totalPaid / summary.totalDue) * 100).toFixed(0) : '0'}%
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${summary.totalDue > 0 ? (summary.totalPaid / summary.totalDue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}