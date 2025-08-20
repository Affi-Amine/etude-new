import { useState, useEffect } from 'react'

interface PaymentStatusData {
  groupId: string
  groupName: string
  status: 'A_JOUR' | 'EN_ATTENTE' | 'EN_RETARD'
  amountDue: number
  attendedSessions: number
  totalSessionsInCycle: number
  nextDueDate?: Date
}

interface StudentPaymentStatus {
  studentId: string
  paymentStatuses: PaymentStatusData[]
  overallStatus: 'A_JOUR' | 'EN_ATTENTE' | 'EN_RETARD'
  totalAmountDue: number
}

export function usePaymentStatus(studentId: string | null) {
  const [paymentStatus, setPaymentStatus] = useState<StudentPaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setPaymentStatus(null)
      return
    }

    const fetchPaymentStatus = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/students/payment-status?studentId=${studentId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment status')
        }
        
        const data = await response.json()
        setPaymentStatus(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching payment status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentStatus()
  }, [studentId])

  return { paymentStatus, loading, error }
}

export function useMultiplePaymentStatuses(studentIds: string[]) {
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, StudentPaymentStatus>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentIds.length === 0) {
      setPaymentStatuses({})
      return
    }

    const fetchMultiplePaymentStatuses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const promises = studentIds.map(async (studentId) => {
          const response = await fetch(`/api/students/payment-status?studentId=${studentId}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch payment status for student ${studentId}`)
          }
          const data = await response.json()
          return { studentId, data }
        })
        
        const results = await Promise.all(promises)
        const statusMap: Record<string, StudentPaymentStatus> = {}
        
        results.forEach(({ studentId, data }) => {
          statusMap[studentId] = data
        })
        
        setPaymentStatuses(statusMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching multiple payment statuses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMultiplePaymentStatuses()
  }, [studentIds.join(',')])

  return { paymentStatuses, loading, error }
}