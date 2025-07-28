import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1),
})

const removeStudentSchema = z.object({
  studentId: z.string(),
})

// POST /api/groups/[id]/students - Add students to group
export async function POST(
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
    const { studentIds } = addStudentsSchema.parse(body)

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get existing group memberships
    const existingMemberships = await prisma.groupStudent.findMany({
      where: {
        groupId: id,
        studentId: { in: studentIds }
      }
    })

    const existingStudentIds = existingMemberships.map(m => m.studentId)
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id))

    // Reactivate existing memberships
    if (existingMemberships.length > 0) {
      await prisma.groupStudent.updateMany({
        where: {
          groupId: id,
          studentId: { in: existingStudentIds }
        },
        data: {
          isActive: true,
          leftAt: null
        }
      })
    }

    // Create new memberships
    if (newStudentIds.length > 0) {
      await prisma.groupStudent.createMany({
        data: newStudentIds.map(studentId => ({
          groupId: id,
          studentId,
          teacherId: session.user.id,
        }))
      })
    }

    // Return updated group with students
    const updatedGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                classe: true,
                lycee: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error adding students to group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/students - Remove student from group
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

    const body = await request.json()
    const { studentId } = removeStudentSchema.parse(body)

    // Deactivate the group membership
    await prisma.groupStudent.updateMany({
      where: {
        groupId: id,
        studentId: studentId
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Student removed from group successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error removing student from group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}