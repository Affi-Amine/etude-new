import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  classe: z.string().min(1).optional(),
  lycee: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/students/[id] - Get a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
                scheduleDay: true,
                scheduleTime: true,
                monthlyFee: true,
              }
            }
          },
          where: { isActive: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        attendance: {
          include: {
            session: {
              include: {
                group: {
                  select: {
                    name: true,
                    subject: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - Update a student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateStudentSchema.parse(body)

    const student = await prisma.student.update({
      where: { id },
      data: validatedData,
      include: {
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - Delete (deactivate) a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete by setting isActive to false
    const student = await prisma.student.update({
      where: { id },
      data: { isActive: false }
    })

    // Also deactivate group memberships
    await prisma.groupStudent.updateMany({
      where: { studentId: id },
      data: { isActive: false, leftAt: new Date() }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}