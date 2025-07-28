import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPendingPaymentIfNeeded } from '@/lib/payment-logic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId } = body

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Verify group belongs to user
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id
      },
      include: {
        students: {
          where: {
            isActive: true
          },
          include: {
            student: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    let generatedCount = 0;

    // Generate pending payments for all students who need them
    for (const groupStudent of group.students) {
      try {
        const wasGenerated = await createPendingPaymentIfNeeded(
          groupStudent.student.id,
          groupId,
          session.user.id
        );
        
        if (wasGenerated) {
          generatedCount++;
        }
      } catch (error) {
        console.error(`Error generating payment for student ${groupStudent.student.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `${generatedCount} paiements générés avec succès`,
      generatedCount,
      totalStudents: group.students.length
    });
  } catch (error) {
    console.error('Error generating payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}