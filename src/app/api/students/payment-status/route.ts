import { NextRequest, NextResponse } from 'next/server'
import { calculateStudentPaymentStatus } from '@/lib/payment-logic'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const groupId = searchParams.get('groupId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Get all groups for the student if no specific group is provided
    const studentGroups = await prisma.groupStudent.findMany({
      where: {
        studentId,
        isActive: true,
        teacherId: session.user.id
      },
      include: {
        group: true
      }
    })

    if (studentGroups.length === 0) {
      return NextResponse.json({
        studentId,
        paymentStatuses: [],
        overallStatus: 'A_JOUR'
      })
    }

    // Calculate payment status for each group
    const paymentStatuses = await Promise.all(
      studentGroups.map(async (sg) => {
        try {
          const paymentData = await calculateStudentPaymentStatus(studentId, sg.groupId)
          return {
            groupId: sg.groupId,
            groupName: sg.group.name,
            status: paymentData.currentStatus,
            amountDue: paymentData.amountDue,
            attendedSessions: paymentData.attendedSessions,
            totalSessionsInCycle: paymentData.totalSessionsInCycle,
            nextDueDate: paymentData.nextDueDate
          }
        } catch (error) {
          console.error(`Error calculating payment status for student ${studentId} in group ${sg.groupId}:`, error)
          return {
            groupId: sg.groupId,
            groupName: sg.group.name,
            status: 'A_JOUR' as const,
            amountDue: 0,
            attendedSessions: 0,
            totalSessionsInCycle: 0,
            nextDueDate: undefined
          }
        }
      })
    )

    // Determine overall status (prioritize worst status)
    const statusPriority = { 'A_JOUR': 0, 'EN_ATTENTE': 1, 'EN_RETARD': 2 }
    const overallStatus = paymentStatuses.reduce((worst, current) => {
      return (statusPriority[current.status] || 0) > (statusPriority[worst.status] || 0) ? current : worst
    }, paymentStatuses[0] || { status: 'A_JOUR' as const })

    return NextResponse.json({
      studentId,
      paymentStatuses,
      overallStatus: overallStatus.status,
      totalAmountDue: paymentStatuses.reduce((sum, status) => sum + status.amountDue, 0)
    })

  } catch (error) {
    console.error('Error fetching student payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}