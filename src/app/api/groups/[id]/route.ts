import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  scheduleDay: z.string().min(1).optional(),
  scheduleTime: z.string().min(1).optional(),
  scheduleDuration: z.number().min(30).optional(),
  monthlyFee: z.number().min(0).optional(),
  sessionFee: z.number().min(0).optional(),
  registrationFee: z.number().min(0).optional(),
  paymentDeadline: z.number().min(1).max(31).optional(),
  isActive: z.boolean().optional(),
})

const addStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1),
})

// GET /api/groups/[id] - Get a specific group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                niveau: true,
                section: true,
                lycee: true,
              }
            }
          }
        },
        sessions: {
          include: {
            attendance: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        },
        payments: {
          include: {
            student: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id] - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    const group = await prisma.group.update({
      where: { id },
      data: validatedData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                niveau: true,
                section: true,
                lycee: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id] - Hard delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Verify that the group belongs to the current teacher
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.userId
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      )
    }

    // Hard delete: Remove all related data first, then the group
    // This is a cascading delete to maintain data integrity
    
    // 1. Delete all attendance records for sessions in this group
    await prisma.attendance.deleteMany({
      where: {
        session: {
          groupId: groupId
        }
      }
    })

    // 2. Delete all sessions for this group
    await prisma.session.deleteMany({
      where: {
        groupId: groupId
      }
    })

    // 3. Delete all payments for this group
    await prisma.payment.deleteMany({
      where: {
        groupId: groupId
      }
    })

    // 4. Delete all group-student relationships
    await prisma.groupStudent.deleteMany({
      where: {
        groupId: groupId
      }
    })

    // 5. Finally, delete the group itself
    await prisma.group.delete({
      where: {
        id: groupId
      }
    })

    return NextResponse.json({ 
      message: 'Group deleted successfully',
      deletedGroupId: groupId
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}