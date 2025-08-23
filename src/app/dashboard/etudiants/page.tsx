'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  MoreVertical,
  Users,
  GraduationCap,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useStudents } from '@/hooks/useStudents'
import { useGroups } from '@/hooks/useGroups'
import { useMultiplePaymentStatuses } from '@/hooks/usePaymentStatus'
import { toast } from 'sonner'
// Removed client-side payment calculation - using simplified calculation
import { formatCurrency, getInitials, getPaymentStatusText, getPaymentStatusColor } from '@/lib/utils'
import type { Student } from '@/lib/types'

type FilterType = 'all' | 'active' | 'inactive' | 'needs-payment' | 'paid'
type SortType = 'name' | 'level' | 'groups' | 'payment-status'

export default function EtudiantsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // API hooks
  const { students, loading: studentsLoading, deleteStudent } = useStudents()
  const { groups, loading: groupsLoading } = useGroups()

  // Get payment statuses for all students
  const studentIds = students?.map(s => s.id) || []
  const { paymentStatuses, loading: paymentLoading } = useMultiplePaymentStatuses(studentIds)

  // Calculate student data with payment status
  const studentsWithPaymentStatus = useMemo(() => {
    if (!students || !groups) return []
    
    return students.map(student => {
      const studentGroups = groups.filter(group => 
        group.students?.some((gs: any) => gs.studentId === student.id)
      )
      
      const studentPaymentData = paymentStatuses[student.id]
      
      // Create payment status object compatible with existing code
      const paymentStatus = {
        status: studentPaymentData?.overallStatus === 'A_JOUR' ? 'paid' as const :
                studentPaymentData?.overallStatus === 'EN_ATTENTE' ? 'pending' as const :
                studentPaymentData?.overallStatus === 'EN_RETARD' ? 'overdue' as const : 'paid' as const,
        amount: studentPaymentData?.totalAmountDue || 0,
        dueDate: new Date(),
        studentId: student.id,
        groupId: studentGroups[0]?.id || '',
        currentCycleSessions: 0,
        attendedSessions: 0,
        paymentDue: studentPaymentData?.overallStatus !== 'A_JOUR',
        overflowSessions: 0,
        nextPaymentAmount: studentPaymentData?.totalAmountDue || 0,
        statusMessage: ''
      }
       
      return {
        ...student,
        paymentStatus,
        totalOwed: studentPaymentData?.totalAmountDue || 0
      }
    })
  }, [students, groups, paymentStatuses])

  // Delete handlers
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteStudent(studentToDelete.id)
      toast.success(`Étudiant ${studentToDelete.name} supprimé avec succès`)
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setStudentToDelete(null)
  }

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = studentsWithPaymentStatus.filter(student => {
      // Search filter
      const matchesSearch = !searchTerm || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Get student groups
      const studentGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === student.id))
      
      // Type filter
      const matchesType = (() => {
        switch (filterType) {
          case 'active': return studentGroups.length > 0
          case 'inactive': return studentGroups.length === 0
          case 'needs-payment': return ['approaching', 'due', 'overdue'].includes(student.paymentStatus.status)
          case 'paid': return student.paymentStatus.status === 'paid'
          default: return true
        }
      })()
      
      return matchesSearch && matchesType
    })

    // Sort students
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'level':
          return (a.niveau + ' ' + a.section).localeCompare(b.niveau + ' ' + b.section)
        case 'groups':
          const aGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === a.id)).length
          const bGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === b.id)).length
          return bGroups - aGroups
        case 'payment-status':
          const priority: Record<string, number> = { 'overdue': 0, 'due': 1, 'approaching': 2, 'paid': 3 }
          return (priority[a.paymentStatus.status] || 3) - (priority[b.paymentStatus.status] || 3)
        default:
          return 0
      }
    })

    return filtered
  }, [studentsWithPaymentStatus, searchTerm, filterType, sortType, groups])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalStudents = students?.length || 0
    const activeStudents = studentsWithPaymentStatus.filter(s => {
      const studentGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === s.id))
      return studentGroups.length > 0
    }).length
    const studentsNeedingPayment = studentsWithPaymentStatus.filter(s => 
      ['due', 'overdue'].includes(s.paymentStatus.status)
    ).length
    const totalOwed = studentsWithPaymentStatus.reduce((sum, s) => sum + (s.paymentStatus.amount || 0), 0)
    
    return {
      totalStudents,
      activeStudents,
      studentsNeedingPayment,
      totalOwed
    }
  }, [students, studentsWithPaymentStatus])

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-orange-100 text-orange-800'
      case 'overflow': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'À jour'
      case 'pending': return 'En attente'
      case 'overdue': return 'En retard'
      case 'overflow': return 'Dépassé'
      default: return 'Inconnu'
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100'
    if (rate >= 75) return 'text-blue-600 bg-blue-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'bg-indigo-600',
      'from-yellow-500 to-orange-500',
      'from-teal-500 to-cyan-500',
      'from-violet-500 to-purple-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (studentsLoading || groupsLoading || paymentLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Étudiants</h1>
            <p className="text-gray-600 mt-1">Gérez vos étudiants et suivez leurs progrès et paiements</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/dashboard/etudiants/nouveau">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel étudiant
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Étudiants</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Étudiants Actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements en Attente</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.studentsNeedingPayment}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Dû</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totalOwed)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un étudiant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les étudiants</SelectItem>
                    <SelectItem value="active">Étudiants actifs</SelectItem>
                    <SelectItem value="inactive">Étudiants inactifs</SelectItem>
                    <SelectItem value="needs-payment">Paiement requis</SelectItem>
                    <SelectItem value="paid">À jour</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="level">Niveau</SelectItem>
                    <SelectItem value="groups">Nombre de groupes</SelectItem>
                    <SelectItem value="payment-status">Statut paiement</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Plus de filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Students Grid/List */}
        {viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredAndSortedStudents.map((student, index) => {
              
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="card-hover border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-6">
                      {/* Avatar and basic info */}
                      <div className="text-center mb-4">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getAvatarColor(student.name)} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}>
                          {getInitials(student.name)}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{student.niveau} {student.section}</p>
                      </div>
                      
                      {/* Contact info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{student.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{groups.filter(group => group.students?.some((gs: any) => gs.studentId === student.id)).length}</div>
                          <div className="text-xs text-gray-600">Groupes</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{formatCurrency(student.totalOwed)}</div>
                          <div className="text-xs text-gray-600">Dû</div>
                        </div>
                      </div>
                      
                      {/* Payment status */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Statut Paiement</span>
                          <Badge className={getPaymentStatusColor(student.paymentStatus.status)}>
                            {getPaymentStatusText(student.paymentStatus.status)}
                          </Badge>
                        </div>
                        {(student.paymentStatus.amount || student.paymentStatus.nextPaymentAmount) > 0 && (
                          <div className="text-sm text-gray-600">
                            {formatCurrency(student.paymentStatus.amount || student.paymentStatus.nextPaymentAmount)} dû
                          </div>
                        )}
                      </div>
                      
                      {/* Groups */}
                      {(() => {
                        const studentGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === student.id))
                        return studentGroups.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-2">Groupes:</p>
                            <div className="flex flex-wrap gap-1">
                              {studentGroups.slice(0, 2).map(group => (
                                <span key={group.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                  {group.subject}
                                </span>
                              ))}
                              {studentGroups.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{studentGroups.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Étudiant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Niveau
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groupes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut Paiement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant Dû
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedStudents.map((student, index) => {
                        
                        return (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getAvatarColor(student.name)} flex items-center justify-center text-white font-medium text-sm mr-3`}>
                                  {getInitials(student.name)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Inscrit le {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('fr-FR') : new Date(student.createdAt).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.email || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{student.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                {student.niveau} {student.section}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const studentGroups = groups.filter(group => group.students?.some((gs: any) => gs.studentId === student.id))
                                return (
                                  <div className="flex flex-wrap gap-1">
                                    {studentGroups.slice(0, 2).map(group => (
                                      <span key={group.id} className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                                        {group.subject}
                                      </span>
                                    ))}
                                    {studentGroups.length > 2 && (
                                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                        +{studentGroups.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getPaymentStatusColor(student.paymentStatus.status)}>
                                {getPaymentStatusText(student.paymentStatus.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(student.totalOwed)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteClick(student)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {filteredAndSortedStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center py-12"
          >
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(students?.length || 0) === 0 ? 'Aucun étudiant inscrit' : 'Aucun étudiant trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                {(students?.length || 0) === 0 
                  ? 'Commencez par inscrire votre premier étudiant'
                  : 'Essayez de modifier vos critères de recherche'
                }
              </p>
              {(students?.length || 0) === 0 && (
              <Link href="/dashboard/etudiants/nouveau">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter mon premier étudiant
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'étudiant</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{studentToDelete?.name}</strong> ?
                Cette action est irréversible et supprimera toutes les données associées à cet étudiant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm} 
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}