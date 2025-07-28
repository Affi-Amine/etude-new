import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStudentPaymentStatus } from '@/lib/payment-logic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all groups for the teacher
    const groups = await prisma.group.findMany({
      where: {
        teacherId: session.user.id,
        isActive: true
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

    // Get all payments for all groups
    const allPayments = await prisma.payment.findMany({
      where: {
        groupId: {
          in: groups.map(g => g.id)
        }
      }
    })

    // Calculate global statistics
    const totalRevenue = allPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const pendingAmount = allPayments
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const overdueAmount = allPayments
      .filter((p) => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const totalGroups = groups.length;
    const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);

    // Calculate student statuses across all groups
    let studentsUpToDate = 0;
    let studentsWithOverdue = 0;
    let studentsWithPending = 0;

    for (const group of groups) {
      for (const groupStudent of group.students) {
        try {
          const paymentData = await calculateStudentPaymentStatus(
            groupStudent.student.id,
            group.id
          );
          
          switch (paymentData.currentStatus) {
            case 'A_JOUR':
              studentsUpToDate++;
              break;
            case 'EN_RETARD':
              studentsWithOverdue++;
              break;
            case 'EN_ATTENTE':
              studentsWithPending++;
              break;
          }
        } catch (error) {
          console.error(`Error calculating status for student ${groupStudent.student.id}:`, error);
          // Default to pending if calculation fails
          studentsWithPending++;
        }
      }
    }

    return NextResponse.json({
      totalRevenue,
      pendingAmount,
      overdueAmount,
      totalGroups,
      activeStudents: totalStudents,
      studentsUpToDate,
      studentsWithOverdue,
      studentsWithPending,
    });
  } catch (error) {
    console.error('Error fetching global payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}