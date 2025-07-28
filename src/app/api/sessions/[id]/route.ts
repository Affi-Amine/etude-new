import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db-tenant'
import { z } from 'zod'

const updateSessionSchema = z.object({
  groupId: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
})

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

    const prisma = await getTenantPrisma()

    const sessionData = await prisma.session.findFirst({
      where: {
        id,
        group: {
          teacherId: session.user.id
        }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true,
            scheduleDuration: true,
          }
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const validatedData = updateSessionSchema.parse(body)
    const prisma = await getTenantPrisma()

    // Verify the session belongs to the current teacher
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        group: {
          teacherId: session.user.id
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // If groupId is being updated, verify the new group belongs to the teacher
    if (validatedData.groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: validatedData.groupId,
          teacherId: session.user.id
        }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found or access denied' },
          { status: 404 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true,
            scheduleDuration: true,
          }
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const prisma = await getTenantPrisma()

    // Verify the session belongs to the current teacher
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        group: {
          teacherId: session.user.id
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Delete attendance records first (if any)
    await prisma.attendance.deleteMany({
      where: { sessionId: id }
    })

    // Delete the session
    await prisma.session.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}