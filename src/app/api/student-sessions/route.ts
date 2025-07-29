import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get all sessions for this group
    const sessions = await prisma.session.findMany({
      where: {
        groupId: groupId,
        status: 'COMPLETED'
      },
      include: {
        attendance: true
      }
    })

    // Get recent payments for students in this group
    const studentIds = group.students.map(gs => gs.student.id)
    const recentPayments = await prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
        groupId: groupId,
        status: 'PAID'
      },
      orderBy: {
        paidDate: 'desc'
      }
    })

    // Calculate session data for each student
    const studentsData = group.students.map(groupStudent => {
      const student = groupStudent.student
      
      // Count sessions attended by this student
      const sessionsAttended = sessions.filter(session => 
        session.attendance.some(att => att.studentId === student.id && att.status === 'PRESENT')
      ).length

      // Get payment threshold and session fee
      const paymentThreshold = group.paymentThreshold || 4
      const sessionFee = group.sessionFee || (group.monthlyFee ? (group.monthlyFee / paymentThreshold) : 0)
      
      // Check if student has recent payment
      const lastPayment = recentPayments.find(payment => payment.studentId === student.id)
      const isPaid = !!lastPayment
      
      return {
        studentId: student.id,
        studentName: student.name,
        sessionsAttended,
        paymentThreshold,
        sessionFee,
        totalAmount: paymentThreshold * sessionFee,
        isPaid,
        lastPaymentDate: lastPayment?.paidDate
      }
    })

    return NextResponse.json({
      students: studentsData,
      group: {
        id: group.id,
        name: group.name,
        paymentThreshold: group.paymentThreshold || 4,
        sessionFee: group.sessionFee || 0
      }
    })

  } catch (error) {
    console.error('Error fetching student session data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}