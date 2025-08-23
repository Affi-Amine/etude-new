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

    // Get all groups for the teacher with their students
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
    });

    // Calculate statistics for each group
    const groupStats = await Promise.all(
      groups.map(async (group) => {
        // Get payments for this group
        const groupPayments = await prisma.payment.findMany({
          where: {
            groupId: group.id
          }
        });

        // Calculate revenue from actual payments
        const totalRevenue = groupPayments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + p.amount, 0);

        // Calculate student payment statuses and amounts
        let studentsUpToDate = 0;
        let studentsOverdue = 0;
        let studentsPending = 0;
        let totalPendingAmount = 0;
        let totalOverdueAmount = 0;

        for (const groupStudent of group.students) {
          try {
            const paymentStatus = await calculateStudentPaymentStatus(
              groupStudent.student.id,
              group.id
            );

            switch (paymentStatus.currentStatus) {
              case 'A_JOUR':
                studentsUpToDate++;
                break;
              case 'EN_RETARD':
                studentsOverdue++;
                totalOverdueAmount += paymentStatus.amountDue;
                break;
              case 'EN_ATTENTE':
                studentsPending++;
                totalPendingAmount += paymentStatus.amountDue;
                break;
            }
          } catch (error) {
            console.error(`Error calculating status for student ${groupStudent.student.id}:`, error);
            studentsPending++; // Default to pending on error
          }
        }

        return {
          groupId: group.id,
          groupName: group.name,
          subject: group.subject,
          totalRevenue,
          pendingAmount: totalPendingAmount,
          overdueAmount: totalOverdueAmount,
          studentsUpToDate,
          studentsOverdue,
          studentsPending,
          totalStudents: group.students.length
        };
      })
    );

    return NextResponse.json(groupStats);
  } catch (error) {
    console.error('Error fetching group payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}