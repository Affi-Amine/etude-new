import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const studentRegisterSchema = z.object({
  invitationCode: z.string().length(6),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).max(15), // More flexible phone validation
  password: z.string().min(6),
  classe: z.string().min(1),
  lycee: z.string().min(1),
  level: z.string().optional(),
})

// POST /api/student/register - Student self-registration with invitation code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invitationCode,
      name,
      email,
      phone,
      password,
      classe,
      lycee,
      level
    } = studentRegisterSchema.parse(body)

    // Find and validate invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: {
        code: invitationCode,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            teacherId: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 400 }
      )
    }

    if (!invitation.isActive) {
      return NextResponse.json(
        { error: 'Invitation code is no longer active' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation code has expired' },
        { status: 400 }
      )
    }

    if (invitation.currentUses >= invitation.maxUses) {
      return NextResponse.json(
        { error: 'Invitation code has reached maximum uses' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if student already exists with this email
    const existingStudent = await prisma.student.findFirst({
      where: { email }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user account and student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'STUDENT',
          status: 'APPROVED', // Auto-approve students who register with valid codes
          phone,
        }
      })

      // Create student profile
      const student = await tx.student.create({
        data: {
          teacherId: invitation.group.teacherId,
          userId: user.id,
          name,
          email,
          phone,
          classe,
          lycee,
          level: level || '',
          enrollmentDate: new Date(),
        }
      })

      // Add student to the group
      await tx.groupStudent.create({
        data: {
          groupId: invitation.group.id,
          studentId: student.id,
          teacherId: invitation.group.teacherId,
        }
      })

      // Update invitation usage count
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          currentUses: invitation.currentUses + 1
        }
      })

      return { user, student }
    })

    // Generate family code for parent connections
    const familyCode = Math.floor(100000 + Math.random() * 900000).toString()

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      student: {
        id: result.student.id,
        name: result.student.name,
        email: result.student.email,
        familyCode, // This will be stored separately when needed
      },
      group: {
        id: invitation.group.id,
        name: invitation.group.name,
        subject: invitation.group.subject,
      }
    })

  } catch (error) {
    console.error('Student registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/student/register?code=123456 - Validate invitation code and get group info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid invitation code format' },
        { status: 400 }
      )
    }

    const invitation = await prisma.groupInvitation.findUnique({
      where: { code },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true,
          }
        },
        teacher: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 404 }
      )
    }

    if (!invitation.isActive || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation code is expired or inactive' },
        { status: 400 }
      )
    }

    if (invitation.currentUses >= invitation.maxUses) {
      return NextResponse.json(
        { error: 'Invitation code has reached maximum uses' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        group: invitation.group,
        teacher: invitation.teacher,
        usesRemaining: invitation.maxUses - invitation.currentUses,
        expiresAt: invitation.expiresAt,
      }
    })

  } catch (error) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}