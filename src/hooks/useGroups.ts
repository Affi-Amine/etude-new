import { useState, useEffect } from 'react'
import { Group } from '@/lib/types'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups')
      
      if (!response.ok) {
        // Clear groups array when authentication fails or other errors occur
        setGroups([])
        if (response.status === 401) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.')
        }
        throw new Error(`Échec du chargement des groupes (${response.status})`)
      }
      
      const data = await response.json()
      setGroups(data)
      setError(null)
    } catch (err) {
      // Ensure groups array is cleared on any error
      setGroups([])
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create a new group
  const createGroup = async (groupData: {
    name: string
    subject: string
    weeklySchedule?: any[]
    sessionFee: number
    paymentThreshold: number
    registrationFee?: number
    semesterStartDate?: Date
    semesterEndDate?: Date
    studentIds?: string[]
    // Legacy support
    schedule?: {
      day: string
      time: string
      duration: number
    }
    paymentConfig?: {
      monthlyFee: number
      sessionFee?: number
      registrationFee?: number
      paymentDeadline: number
    }
  }) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create group')
      }
      
      const result = await response.json()
      // Handle both direct group object and wrapped response
      const newGroup = result.group || result
      setGroups(prev => [...prev, newGroup])
      return newGroup
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create group')
    }
  }

  // Update a group
  const updateGroup = async (id: string, groupData: Partial<{
    name: string
    subject: string
    scheduleDay: string
    scheduleTime: string
    scheduleDuration: number
    monthlyFee: number
    sessionFee?: number
    registrationFee?: number
    paymentDeadline: number
  }>) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update group')
      }
      
      const updatedGroup = await response.json()
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g))
      return updatedGroup
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update group')
    }
  }

  // Delete a group (soft delete)
  const deleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.')
        }
        throw new Error(`Échec de la suppression du groupe (${response.status})`)
      }
      
      setGroups(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }

  // Add students to a group
  const addStudentsToGroup = async (groupId: string, studentIds: string[]) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add students to group')
      }
      
      const updatedGroup = await response.json()
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g))
      return updatedGroup
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add students to group')
    }
  }

  // Remove student from a group
  const removeStudentFromGroup = async (groupId: string, studentId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove student from group')
      }
      
      // Refresh groups to get updated data
      await fetchGroups()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove student from group')
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchGroups()
  }, [])

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addStudentsToGroup,
    removeStudentFromGroup,
  }
}