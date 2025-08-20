import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Generate a 6-digit family code
function generateFamilyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/student/family-code - Generate family code for parent connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Find student profile
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        groups: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // Check if student already has an active family code that hasn't been used
    // Since parentUserId is required, we'll check for unused codes differently
    const existingUnusedCode = await prisma.parentConnection.findFirst({
      where: {
        studentId: student.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // For now, we'll always generate a new code since the schema requires parentUserId
    // In a real implementation, you might want to modify the schema to allow null parentUserId

    // Return existing code if found (commented out for now due to schema constraints)
    // if (existingUnusedCode) {
    //   return NextResponse.json({
    //     success: true,
    //     familyCode: existingUnusedCode.familyCode,
    //     student: {
    //       id: student.id,
    //       name: student.name,
    //       classe: student.classe,
    //       lycee: student.lycee,
    //       teacher: student.teacher,
    //       groups: student.groups.map(gs => gs.group)
    //     },
    //     joinUrl: `${process.env.NEXTAUTH_URL}/parent/join/${existingUnusedCode.familyCode}`
    //   })
    // }

    // Generate unique family code
    let familyCode: string
    let isUnique = false
    let attempts = 0
    
    do {
      familyCode = generateFamilyCode()
      const existing = await prisma.parentConnection.findUnique({
        where: { familyCode }
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique family code' },
        { status: 500 }
      )
    }

    // Update the student with the new family code
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: { familyCode },
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        groups: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      familyCode,
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        classe: updatedStudent.classe,
        lycee: updatedStudent.lycee,
        teacher: updatedStudent.teacher,
        groups: updatedStudent.groups.map(gs => gs.group)
      },
      joinUrl: `${process.env.NEXTAUTH_URL}/parent/join/${familyCode}`
    })

  } catch (error) {
    console.error('Generate family code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/student/family-code - Get existing family connections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Find student profile
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // Get parent connections
    const connections = await prisma.parentConnection.findMany({
      where: {
        studentId: student.id,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get the most recent family code if any
    const latestConnection = connections[0]
    
    return NextResponse.json({
      success: true,
      familyCode: latestConnection?.familyCode || null,
      connections: connections.map(conn => ({
        id: conn.id,
        relationship: conn.relationship,
        createdAt: conn.createdAt,
        parent: conn.parent
      }))
    })

  } catch (error) {
    console.error('Get family connections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}