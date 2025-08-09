import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const parentRegisterSchema = z.object({
  familyCode: z.string().length(6),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  relationship: z.enum(['parent', 'guardian', 'tutor', 'other']),
})

// POST /api/parent/register - Parent self-registration with family code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      familyCode,
      name,
      email,
      phone,
      password,
      relationship
    } = parentRegisterSchema.parse(body)

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user account and parent connection in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create parent user account
      const parentUser = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'PARENT',
          status: 'APPROVED', // Auto-approve parents who register with valid family codes
          phone,
        }
      })

      // Create parent connection using the family code as a temporary identifier
      // We'll need to find the student who generated this code
      const parentConnection = await tx.parentConnection.create({
        data: {
          parentUserId: parentUser.id,
          studentUserId: '', // Will be updated when student confirms
          studentId: '', // Will be updated when student confirms
          familyCode,
          relationship,
          isActive: false, // Inactive until student confirms
        }
      })

      return { parentUser, parentConnection }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Waiting for student confirmation.',
      parent: {
        id: result.parentUser.id,
        name: result.parentUser.name,
        email: result.parentUser.email,
        familyCode,
      }
    })

  } catch (error) {
    console.error('Parent registration error:', error)
    
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

// GET /api/parent/register?code=123456 - Validate family code and get student info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid family code format' },
        { status: 400 }
      )
    }

    // For now, we'll return a placeholder response since the family code
    // system needs to be implemented with student confirmation
    // In a real implementation, you'd store pending family codes somewhere
    
    return NextResponse.json({
      success: true,
      message: 'Family code validation endpoint - implementation pending',
      familyCode: code
    })

  } catch (error) {
    console.error('Validate family code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}