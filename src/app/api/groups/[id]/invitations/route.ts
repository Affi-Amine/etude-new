import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import QRCode from 'qrcode'

const createInvitationSchema = z.object({
  maxUses: z.number().min(1).max(100).default(50),
  expiresInDays: z.number().min(1).max(30).default(7),
})

// Generate a 6-digit invitation code
function generateInvitationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/groups/[id]/invitations - Create group invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { maxUses, expiresInDays } = createInvitationSchema.parse(body)

    // Verify teacher owns the group
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id,
        isActive: true
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    // Deactivate existing invitations for this group
    await prisma.groupInvitation.updateMany({
      where: {
        groupId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Generate new invitation code
    let code: string
    let isUnique = false
    let attempts = 0
    
    do {
      code = generateInvitationCode()
      const existing = await prisma.groupInvitation.findUnique({
        where: { code }
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Generate QR code
    const joinUrl = `${process.env.NEXTAUTH_URL}/student/join/${code}`
    const qrCodeData = await QRCode.toDataURL(joinUrl)

    // Create invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        groupId,
        teacherId: session.user.id,
        code,
        qrCode: qrCodeData,
        maxUses,
        expiresAt,
      },
      include: {
        group: {
          select: {
            name: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        code: invitation.code,
        qrCode: invitation.qrCode,
        joinUrl,
        maxUses: invitation.maxUses,
        currentUses: invitation.currentUses,
        expiresAt: invitation.expiresAt,
        group: invitation.group
      }
    })

  } catch (error) {
    console.error('Create invitation error:', error)
    
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

// GET /api/groups/[id]/invitations - Get active invitations for group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: groupId } = await params

    // Verify teacher owns the group
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id,
        isActive: true
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    const invitations = await prisma.groupInvitation.findMany({
      where: {
        groupId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        group: {
          select: {
            name: true,
            subject: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedInvitations = invitations.map(inv => ({
      id: inv.id,
      code: inv.code,
      qrCode: inv.qrCode,
      joinUrl: `${process.env.NEXTAUTH_URL}/student/join/${inv.code}`,
      maxUses: inv.maxUses,
      currentUses: inv.currentUses,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      group: inv.group
    }))

    return NextResponse.json({
      success: true,
      invitations: formattedInvitations
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}