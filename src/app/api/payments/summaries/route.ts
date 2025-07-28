import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStudentPaymentStatus, mapPaymentStatusToDisplay } from '@/lib/payment-logic'

// GET - Fetch payment summaries for students
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Get group with students
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id
      },
      include: {
        students: {
          where: {
            isActive: true
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Calculate summaries for each student using the new logic
    const summaries = await Promise.all(
      group.students.map(async (groupStudent) => {
        try {
          const paymentData = await calculateStudentPaymentStatus(
            groupStudent.student.id,
            groupId
          )

          // Get current payments for this student
          const studentPayments = await prisma.payment.findMany({
            where: {
              studentId: groupStudent.student.id,
              groupId,
            },
          })

          const totalPaid = studentPayments
            .filter((p) => p.status === 'PAID')
            .reduce((sum, p) => sum + p.amount, 0)

          const overdueAmount = studentPayments
            .filter((p) => p.status === 'OVERDUE')
            .reduce((sum, p) => sum + p.amount, 0)

          const pendingAmount = studentPayments
            .filter((p) => p.status === 'PENDING')
            .reduce((sum, p) => sum + p.amount, 0)

          // Find next due date
          const nextDuePayment = studentPayments
            .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

          const lastPaidPayment = studentPayments
            .filter(p => p.status === 'PAID' && p.paidDate)
            .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())[0]

          return {
            studentId: groupStudent.student.id,
            studentName: groupStudent.student.name,
            paymentStatus: mapPaymentStatusToDisplay(paymentData.currentStatus),
            totalDue: pendingAmount + overdueAmount,
            totalPaid: totalPaid || 0,
            overdueAmount: overdueAmount || 0,
            attendedSessions: paymentData.attendedSessions,
            sessionsInCurrentCycle: paymentData.totalSessionsInCycle,
            nextDueDate: nextDuePayment?.dueDate || paymentData.nextDueDate || null,
            lastPaymentDate: lastPaidPayment?.paidDate
          }
        } catch (error) {
          console.error(`Error calculating payment status for student ${groupStudent.student.id}:`, error)
          // Return default values if calculation fails
          return {
            studentId: groupStudent.student.id,
            studentName: groupStudent.student.name,
            paymentStatus: 'EN ATTENTE',
            totalDue: 0,
            totalPaid: 0,
            overdueAmount: 0,
            attendedSessions: 0,
            sessionsInCurrentCycle: 0,
            nextDueDate: null,
            lastPaymentDate: null
          }
        }
      })
    )

    return NextResponse.json(summaries)
  } catch (error) {
    console.error('Error fetching payment summaries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}