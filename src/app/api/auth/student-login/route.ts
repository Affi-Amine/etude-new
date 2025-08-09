import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const studentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// POST /api/auth/student-login - Student authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = studentLoginSchema.parse(body)

    // Find student by email
    const student = await prisma.student.findFirst({
      where: {
        email: email,
        isActive: true
      },
      include: {
        user: true,
        groups: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
                scheduleDay: true,
                scheduleTime: true
              }
            }
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or inactive' },
        { status: 401 }
      )
    }

    // Check if student has a user account
    if (!student.user) {
      return NextResponse.json(
        { error: 'Student portal access not enabled. Please contact your teacher.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Return student data (excluding password)
    const { user, ...studentData } = student
    const { password: _, ...userData } = user

    return NextResponse.json({
      success: true,
      student: {
        ...studentData,
        user: userData
      }
    })

  } catch (error) {
    console.error('Student login error:', error)
    
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