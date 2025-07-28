import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get all pending and overdue payments for this group
    const pendingPayments = await prisma.payment.findMany({
      where: {
        groupId,
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    let remindersSent = 0;

    // In a real application, you would integrate with an email/SMS service
    // For now, we'll just log the reminders and update a "last reminder sent" field
    for (const payment of pendingPayments) {
      try {
        // Update payment with reminder sent timestamp
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            notes: payment.notes ? 
              `${payment.notes} - Rappel envoyé le ${new Date().toLocaleDateString('fr-FR')}` :
              `Rappel envoyé le ${new Date().toLocaleDateString('fr-FR')}`
          }
        });

        // Log reminder details (in production, send actual email/SMS)
        console.log(`Rappel envoyé à ${payment.student.name} (${payment.student.email || payment.student.phone}) pour ${payment.amount} DT`);
        
        remindersSent++;
      } catch (error) {
        console.error(`Error sending reminder for payment ${payment.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `${remindersSent} rappels envoyés avec succès`,
      remindersSent,
      totalPendingPayments: pendingPayments.length,
      details: pendingPayments.map(p => ({
        studentName: p.student.name,
        amount: p.amount,
        status: p.status,
        dueDate: p.dueDate
      }))
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}