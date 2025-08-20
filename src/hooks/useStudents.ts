import { useState, useEffect } from 'react'
import { Student } from '@/lib/types'

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')
      
      if (!response.ok) {
        // Clear students array when authentication fails or other errors occur
        setStudents([])
        throw new Error('Failed to fetch students')
      }
      
      const data = await response.json()
      setStudents(data)
      setError(null)
    } catch (err) {
      // Ensure students array is cleared on any error
      setStudents([])
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create a new student
  const createStudent = async (studentData: {
    name: string
    email?: string
    phone: string
    classe: string
    lycee: string
  }) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create student')
      }
      
      const newStudent = await response.json()
      setStudents(prev => [...prev, newStudent])
      return newStudent
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create student')
    }
  }

  // Update a student
  const updateStudent = async (id: string, studentData: Partial<{
    name: string
    email?: string
    phone: string
    classe: string
    lycee: string
  }>) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update student')
      }
      
      const updatedStudent = await response.json()
      setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s))
      return updatedStudent
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update student')
    }
  }

  // Delete a student
  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(`/api/students?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete student')
      }
      
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete student')
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchStudents()
  }, [])

  return {
    students,
    loading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  }
}