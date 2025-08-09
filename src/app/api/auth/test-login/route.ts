import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)
    
    console.log(`Testing login for email: ${email}`)
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })
    
    if (!user) {
      console.log(`User not found: ${email}`)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log(`User found: ${user.name} (${user.email}) - Status: ${user.status}`)
    
    // Check if user is approved
    if (user.status !== 'APPROVED') {
      console.log(`User not approved: ${user.status}`)
      return NextResponse.json(
        { success: false, error: 'User not approved', status: user.status },
        { status: 403 }
      )
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log(`Password validation result: ${isPasswordValid}`)
    
    if (!isPasswordValid) {
      console.log('Invalid password')
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }
    
    console.log('Authentication successful')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      }
    })
    
  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}