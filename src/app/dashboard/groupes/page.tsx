'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  DollarSign,
  Clock,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Settings,
  MapPin
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


// Removed client-side payment calculation - using simplified calculation
import { formatCurrency, formatDate, getGroupAttendanceRate, formatWeeklySchedule } from '@/lib/utils'
import type { Group, Student } from '@/lib/types'
import { useGroups } from '@/hooks/useGroups'
import { useStudents } from '@/hooks/useStudents'
import NewGroupCreationModal from '@/components/modals/new-group-creation-modal'
import GroupDetailModal from '@/components/modals/group-detail-modal'
import AddStudentModal from '@/components/modals/add-student-modal'

type FilterType = 'all' | 'active' | 'inactive' | 'needs-payment'
type SortType = 'name' | 'students' | 'created' | 'revenue'

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('name')
  
  // API hooks
  const { groups, loading: groupsLoading, createGroup, updateGroup, deleteGroup, addStudentsToGroup } = useGroups()
  const { students, loading: studentsLoading, createStudent, fetchStudents } = useStudents()
  
  // Modal states
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handler functions
  const handleCreateGroup = async (groupData: any & { newStudents?: Array<{name: string, classe: string, lycee: string, phone: string, email?: string}> }) => {
    try {
      setIsLoading(true)
      
      // Create new students if any
      const newStudentIds: string[] = []
      if (groupData.newStudents && groupData.newStudents.length > 0) {
        for (const studentData of groupData.newStudents) {
          const newStudent = await createStudent({
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone,
            classe: studentData.classe,
            lycee: studentData.lycee,
          })
          newStudentIds.push(newStudent.id)
        }
        // Refresh students list to include newly created students
        await fetchStudents()
      }

      // Create the group with safety checks
      await createGroup({
        name: groupData.name,
        subject: groupData.subject,
        weeklySchedule: groupData.weeklySchedule,
        sessionFee: groupData.sessionFee || 0,
        paymentThreshold: groupData.paymentThreshold || 8,
        registrationFee: groupData.registrationFee || 0,
        semesterStartDate: groupData.semesterStartDate,
        semesterEndDate: groupData.semesterEndDate,
        studentIds: [...(groupData.studentIds || []), ...newStudentIds],
      })
      
      setIsCreationModalOpen(false)
    } catch (error) {
      console.error('Error creating group:', error)
      // You might want to show an error toast here
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setIsCreationModalOpen(true)
  }

  const handleUpdateGroup = async (groupData: any) => {
    if (editingGroup) {
      try {
        setIsLoading(true)
        await updateGroup(editingGroup.id, {
          name: groupData.name,
          subject: groupData.subject,
          scheduleDay: groupData.schedule.day,
          scheduleTime: groupData.schedule.time,
          scheduleDuration: groupData.schedule.duration,
          monthlyFee: groupData.paymentConfig.monthlyFee || 0,
          sessionFee: groupData.paymentConfig.sessionFee,
          registrationFee: groupData.paymentConfig.registrationFee,
          paymentDeadline: groupData.paymentConfig.paymentDeadline || 30,
        })
        setEditingGroup(null)
        setIsCreationModalOpen(false)
      } catch (error) {
        console.error('Error updating group:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await deleteGroup(groupId)
        setIsDetailModalOpen(false)
      } catch (error) {
        console.error('Error deleting group:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du groupe'
        alert(errorMessage)
      }
    }
  }

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group)
    setIsDetailModalOpen(true)
  }

  const handleAddStudentsToGroup = async (studentIds: string[]) => {
    if (selectedGroup) {
      try {
        const updatedGroup = await addStudentsToGroup(selectedGroup.id, studentIds)
        setSelectedGroup(updatedGroup)
        setIsAddStudentModalOpen(false)
      } catch (error) {
        console.error('Error adding students to group:', error)
      }
    }
  }

  const handleRemoveStudentFromGroup = async (groupId: string, studentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer cet étudiant du groupe ?')) {
      try {
        // This would use the removeStudentFromGroup function from useGroups hook
        // For now, we'll implement it inline
        const response = await fetch(`/api/groups/${groupId}/students`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        })
        if (response.ok) {
          // Refresh the selected group if it's the one being modified
          if (selectedGroup?.id === groupId) {
            const updatedGroup = groups.find(g => g.id === groupId)
            if (updatedGroup) {
              setSelectedGroup({ ...updatedGroup, studentIds: updatedGroup.studentIds?.filter(id => id !== studentId) || [] })
            }
          }
        }
      } catch (error) {
        console.error('Error removing student from group:', error)
      }
    }
  }

  const handleCreateStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const newStudent = await createStudent({
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        classe: studentData.classe,
        lycee: studentData.lycee,
      })
      
      // Add the new student to the current group
      if (selectedGroup) {
        await handleAddStudentsToGroup([newStudent.id])
      }
    } catch (error) {
      console.error('Error creating student:', error)
    }
  }

  // Calculate group statistics
  const groupsWithStats = useMemo(() => {
    return groups.map(group => {
      const groupSessions = group.sessions || []
      const groupStudents = students.filter(student => 
        group.students?.some((gs: any) => gs.studentId === student.id)
      )
      const allPaymentRecords = groupStudents.flatMap(student => student.payments || [])
      
      const attendanceRate = getGroupAttendanceRate(groupSessions, group.id)
      const stats = {
        totalRevenue: allPaymentRecords.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        studentsNeedingPayment: 0, // Will be calculated separately
        totalSessions: groupSessions.length,
        totalStudents: groupStudents.length,
        attendanceRate: attendanceRate
      }
      
      return {
        ...group,
        stats,
        attendanceRate,
        studentsCount: group.students?.length || 0,
        isActive: group.isActive
      }
    })
  }, [groups, students])

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groupsWithStats.filter(group => {
      const matchesSearch = (group.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (group.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      
      const matchesFilter = (() => {
        switch (filterType) {
          case 'active':
            return group.isActive
          case 'inactive':
            return !group.isActive
            case 'needs-payment':
              return group.students?.some((gs: any) => {
                const student = students.find(s => s.id === gs.studentId);
                if (!student) return false;
                // Simplified check - assume students with no recent payments need payment
                const recentPayments = student.payments?.filter((p: any) => {
                  const paymentDate = new Date(p.createdAt || p.date);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return paymentDate > thirtyDaysAgo;
                }) || [];
                return recentPayments.length === 0;
              }) || false;
          default:
            return true
        }
      })()
      
      return matchesSearch && matchesFilter
    })

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'students':
            return (b.students?.length || 0) - (a.students?.length || 0)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'revenue':
          return b.stats.totalRevenue - a.stats.totalRevenue
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    return filtered
  }, [groupsWithStats, searchTerm, filterType, sortBy])

  const totalStats = useMemo(() => {
    return {
      totalGroups: groups.length,
      activeGroups: groups.filter(g => g.isActive).length,
      totalStudents: groups.reduce((sum, g) => sum + (g.students?.length || 0), 0),
      totalRevenue: groupsWithStats.reduce((sum, g) => sum + g.stats.totalRevenue, 0),
      studentsNeedingPayment: groupsWithStats.reduce((sum, g) => sum + g.stats.studentsNeedingPayment, 0)
    }
  }, [groups, groupsWithStats])

  const getStatusBadge = (group: typeof groupsWithStats[0]) => {
    if (!group || !group.isActive) {
      return <Badge variant="secondary">Inactif</Badge>
    }
    if (group.stats?.studentsNeedingPayment > 0) {
      return <Badge variant="destructive">Paiements en attente</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Groupes</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos groupes d'étudiants et suivez leurs progrès
            </p>
          </div>
          <Button 
              onClick={() => setIsCreationModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Groupe
            </Button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Groupes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalGroups}</p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Groupes Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{totalStats.activeGroups}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Étudiants</p>
                  <p className="text-2xl font-bold text-blue-600">{totalStats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements Dus</p>
                  <p className="text-2xl font-bold text-red-600">{totalStats.studentsNeedingPayment}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un groupe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                <SelectItem value="active">Groupes actifs</SelectItem>
                <SelectItem value="inactive">Groupes inactifs</SelectItem>
                <SelectItem value="needs-payment">Paiements dus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Trier par nom</SelectItem>
                <SelectItem value="students">Trier par étudiants</SelectItem>
                <SelectItem value="created">Trier par date</SelectItem>
                <SelectItem value="revenue">Trier par revenus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Groups Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAndSortedGroups.map((group, index) => {
            const groupStudents = students.filter(s => 
              group.students?.some((gs: any) => gs.studentId === s.id)
            )
            const groupSessions = group.sessions || []
            const stats = group.stats
            
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{group.name}</h3>
                        <p className="text-indigo-100 text-sm">{group.subject}</p>
                      </div>
                      {getStatusBadge(group)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      Groupe de {group.subject} - {formatWeeklySchedule(group.weeklySchedule) || (group.scheduleDay && group.scheduleTime ? `${group.scheduleDay} à ${group.scheduleTime}` : 'N/A à N/A')}
                    </p>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">{groupStudents.length}</div>
                        <div className="text-xs text-gray-600">Étudiants</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{groupSessions.length}</div>
                        <div className="text-xs text-gray-600">Sessions</div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Horaire
                        </span>
                        <span className="font-medium">{formatWeeklySchedule(group.weeklySchedule) || (group.scheduleDay && group.scheduleTime ? `${group.scheduleDay} à ${group.scheduleTime}` : 'N/A à N/A')}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Étudiants
                        </span>
                        <span className="font-medium">{groupStudents.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Prix/séance
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(group.sessionFee || (group.monthlyFee ? group.monthlyFee / 4 : 0) || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Payment Alert */}
                    {stats.studentsNeedingPayment > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center text-red-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {stats.studentsNeedingPayment} étudiant{stats.studentsNeedingPayment > 1 ? 's' : ''} en attente de paiement
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Attendance Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taux de présence</span>
                        <span className="font-medium">{Math.round(stats.attendanceRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Actions */}
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-indigo-50"
                        onClick={() => handleViewGroup(group)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-green-50"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Empty State */}
        {filteredAndSortedGroups.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun groupe trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Aucun groupe ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier groupe d\'étudiants.'}
            </p>
            <Button 
              onClick={() => setIsCreationModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un groupe
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <NewGroupCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => {
          setIsCreationModalOpen(false)
          setEditingGroup(null)
        }}
        onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
        editingGroup={editingGroup}
        availableStudents={students}
      />

      <GroupDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedGroup(null)
        }}
        group={selectedGroup}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
        onRemoveStudent={handleRemoveStudentFromGroup}
        onAddStudent={() => setIsAddStudentModalOpen(true)}
      />

      {selectedGroup && (
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          group={selectedGroup}
          onAddStudents={handleAddStudentsToGroup}
          onCreateStudent={handleCreateStudent}
        />
      )}
    </div>
  )
}