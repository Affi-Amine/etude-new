import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { calculateStudentPaymentStatus } from '@/lib/payment-logic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = id
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    // Verify the group belongs to the teacher
    const { prisma } = await import('@/lib/prisma')
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Calculate payment status
    const paymentStatus = await calculateStudentPaymentStatus(studentId, groupId)

    return NextResponse.json(paymentStatus)
  } catch (error) {
    console.error('Error calculating payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}