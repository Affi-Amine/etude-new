import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Fetch data for the authenticated user (teacher)
    const students = await prisma.student.findMany({
      where: {
        teacherId: userId,
      },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    const groups = await prisma.group.findMany({
      where: {
        teacherId: userId,
      },
      include: {
        students: {
          include: {
            student: true,
          },
        },
        sessions: true,
      },
    });

    const sessions = await prisma.session.findMany({
      where: {
        groupId: {
          in: groups.map(group => group.id),
        },
      },
      include: {
        attendance: true,
      },
    });

    const paymentRecords = await prisma.payment.findMany({
      where: {
        studentId: {
          in: students.map(student => student.id),
        },
      },
    });

    return NextResponse.json({
      students,
      groups,
      sessions,
      paymentRecords,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}