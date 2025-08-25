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

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const period = searchParams.get('period') || 'month'; // month, quarter, year

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
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

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all payments for the group in the specified period
    const payments = await prisma.payment.findMany({
      where: {
        groupId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Calculate statistics using the new logic
    const totalRevenue = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0) || 0;

    const totalStudents = group.students.length;
    
    // Calculate student statuses and amounts using the new logic
    let studentsUpToDate = 0;
    let studentsWithOverdue = 0;
    let studentsWithPending = 0;
    let totalPendingAmount = 0;
    let totalOverdueAmount = 0;

    for (const groupStudent of group.students) {
      try {
        const paymentData = await calculateStudentPaymentStatus(
          groupStudent.student.id,
          groupId
        );
        
        switch (paymentData.currentStatus) {
          case 'A_JOUR':
            studentsUpToDate++;
            break;
          case 'EN_RETARD':
            studentsWithOverdue++;
            totalOverdueAmount += paymentData.amountDue;
            break;
          case 'EN_ATTENTE':
            studentsWithPending++;
            totalPendingAmount += paymentData.amountDue;
            break;
        }
      } catch (error) {
        console.error(`Error calculating status for student ${groupStudent.student.id}:`, error);
        // Default to pending if calculation fails
        studentsWithPending++;
      }
    }

    const totalExpected = totalRevenue + totalPendingAmount + totalOverdueAmount;
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

    return NextResponse.json({
      totalRevenue,
      pendingAmount: totalPendingAmount,
      overdueAmount: totalOverdueAmount,
      collectionRate: Math.round(collectionRate * 100) / 100,
      totalStudents,
      studentsUpToDate,
      studentsWithOverdue,
      studentsWithPending,
      period,
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}