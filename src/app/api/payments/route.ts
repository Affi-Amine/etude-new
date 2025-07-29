import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating a new payment
const createPaymentSchema = z.object({
  studentId: z.string(),
  groupId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['MONTHLY_FEE', 'SESSION_FEE', 'REGISTRATION_FEE']),
  paymentMethod: z.string().optional(),
  dueDate: z.string().datetime(),
  paidDate: z.string().datetime().optional(),
  notes: z.string().optional()
})

// Schema for updating a payment
const updatePaymentSchema = z.object({
  id: z.string(),
  amount: z.number().positive().optional(),
  paymentMethod: z.string().optional(),
  paidDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional()
})

// GET - Fetch payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      group: {
        teacherId: session.user.id
      }
    }

    if (groupId) where.groupId = groupId
    if (studentId) where.studentId = studentId
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          group: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Verify that the group belongs to the teacher
    const group = await prisma.group.findFirst({
      where: {
        id: validatedData.groupId,
        teacherId: session.user.id
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      )
    }

    // Verify that the student is in this group
    const groupStudent = await prisma.groupStudent.findFirst({
      where: {
        groupId: validatedData.groupId,
        studentId: validatedData.studentId,
        isActive: true
      }
    })

    if (!groupStudent) {
      return NextResponse.json(
        { error: 'Student not found in this group' },
        { status: 404 }
      )
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        studentId: validatedData.studentId,
        groupId: validatedData.groupId,
        amount: validatedData.amount,
        type: validatedData.type,
        paymentMethod: validatedData.paymentMethod,
        dueDate: new Date(validatedData.dueDate),
        paidDate: validatedData.paidDate ? new Date(validatedData.paidDate) : null,
        notes: validatedData.notes,
        status: validatedData.paidDate ? 'PAID' : 'PENDING',
        teacherId: session.user.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a payment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Verify that the payment belongs to the teacher
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: validatedData.id,
        teacherId: session.user.id
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: {
        id: validatedData.id
      },
      data: {
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.paymentMethod && { paymentMethod: validatedData.paymentMethod }),
        ...(validatedData.paidDate && { paidDate: new Date(validatedData.paidDate) }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.status && { status: validatedData.status })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Verify that the payment belongs to the teacher
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        teacherId: session.user.id
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the payment
    await prisma.payment.delete({
      where: {
        id: paymentId
      }
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}