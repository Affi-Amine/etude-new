import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  parentId: z.string(),
  studentId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const studentId = searchParams.get('studentId')

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      )
    }

    // Get parent with their student connections
    const parent = await prisma.user.findUnique({
      where: { id: parentId, role: 'PARENT' },
      include: {
        parentConnections: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                groups: {
                  include: {
                    group: {
                      include: {
                        teacher: {
                          select: {
                            id: true,
                            name: true,
                            email: true
                          }
                        }
                      }
                    }
                  }
                },
                attendance: {
                  include: {
                    session: {
                      include: {
                        group: {
                          select: {
                            name: true,
                            subject: true
                          }
                        }
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 10 // Get last 10 attendance records
                },
                payments: {
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 5 // Get last 5 payments
                }
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // If specific student requested, filter for that student
    let connections = parent.parentConnections
    if (studentId) {
      connections = connections.filter((conn: any) => conn.student.id === studentId)
    }

    // Process data for each student
    const studentsProgress = await Promise.all(
      connections.map(async (connection: any) => {
        const student = connection.student
        
        // Get all sessions for this student's groups
        const studentGroupIds = student.groups.map((sg: any) => sg.group.id)
        
        const sessions = await prisma.session.findMany({
          where: {
            groupId: { in: studentGroupIds },
            // Only include sessions where attendance has been recorded
            attendance: {
              some: {
                studentId: student.id
              }
            }
          },
          include: {
            group: {
              select: {
                name: true,
                subject: true
              }
            },
            attendance: {
              where: {
                studentId: student.id
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        })

        // Calculate attendance statistics
        const totalSessions = sessions.length
        const attendedSessions = sessions.filter(session => 
          session.attendance.some((att: any) => att.status === 'PRESENT')
        ).length
        const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0

        // Get recent sessions with attendance info
        const recentSessions = sessions.slice(0, 5).map(session => ({
          id: session.id,
          date: session.date.toISOString(),
          subject: session.group.subject,
          attended: session.attendance.some((att: any) => att.status === 'PRESENT'),
          groupName: session.group.name,
          status: session.status
        }))

        // Calculate payment status
        const payments = student.payments
        const lastPayment = payments[0]
        const totalAmountPaid = payments
          .filter((p: any) => p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + p.amount, 0)
        
        // Simple payment status calculation
        let paymentStatus = {
          status: 'A_JOUR',
          amountDue: 0,
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }

        // Check if payment is overdue (simplified logic)
        if (lastPayment && lastPayment.status === 'PENDING' && lastPayment.dueDate < new Date()) {
          paymentStatus = {
            status: 'EN_RETARD',
            amountDue: lastPayment.amount,
            nextPaymentDate: lastPayment.dueDate.toISOString()
          }
        } else if (lastPayment && lastPayment.status === 'PENDING') {
          paymentStatus = {
            status: 'A_PAYER',
            amountDue: lastPayment.amount,
            nextPaymentDate: lastPayment.dueDate.toISOString()
          }
        }

        return {
          studentId: student.id,
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            niveau: student.niveau,
            section: student.section,
            lycee: student.lycee,
            groups: student.groups.map((sg: any) => ({
              id: sg.group.id,
              name: sg.group.name,
              subject: sg.group.subject,
              teacher: sg.group.teacher
            }))
          },
          totalSessions,
          attendedSessions,
          attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
          paymentStatus,
          recentSessions,
          relationship: connection.relationship
        }
      })
    )

    return NextResponse.json({
      parentId: parent.id,
      parentName: parent.name,
      studentsProgress
    })

  } catch (error) {
    console.error('Error fetching parent progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}