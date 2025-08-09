const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStudentData() {
  try {
    console.log('🔍 Checking student data...')
    
    // Find the user and student
    const user = await prisma.user.findUnique({
      where: { email: 'affi.amin.work@gmail.com' },
      include: {
        studentProfile: {
          include: {
            groups: {
              include: {
                group: {
                  include: {
                    teacher: true,
                    sessions: {
                      include: {
                        attendance: true
                      },
                      orderBy: { date: 'desc' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasStudentProfile: !!user.studentProfile
    })
    
    if (!user.studentProfile) {
      console.log('❌ No student profile found for this user')
      
      // Let's also check if there's a student with this email
      const student = await prisma.student.findUnique({
        where: { email: 'affi.amin.work@gmail.com' },
        include: {
          groups: {
            include: {
              group: {
                include: {
                  teacher: true,
                  sessions: {
                    include: {
                      attendance: true
                    },
                    orderBy: { date: 'desc' }
                  }
                }
              }
            }
          }
        }
      })
      
      if (student) {
        console.log('✅ Found student record:', {
          id: student.id,
          name: student.name,
          email: student.email,
          userId: student.userId,
          groupsCount: student.groups.length
        })
        
        console.log('📚 Groups:', student.groups.length)
        
        student.groups.forEach((groupStudent, index) => {
          const group = groupStudent.group
          console.log(`\n📖 Group ${index + 1}:`, {
            id: group.id,
            name: group.name,
            subject: group.subject,
            teacher: group.teacher.name,
            sessionsCount: group.sessions.length
          })
          
          console.log('📅 Sessions:')
          group.sessions.forEach((session, sessionIndex) => {
            const studentAttendance = session.attendance.find(att => att.studentId === student.id)
            console.log(`  ${sessionIndex + 1}. ${session.date} - ${session.title || 'No title'} (${session.status})`, {
              attendance: studentAttendance ? studentAttendance.status : 'No attendance'
            })
          })
        })
        
        // Also check sessions directly for this student
        const directSessions = await prisma.session.findMany({
          where: {
            group: {
              students: {
                some: {
                  studentId: student.id
                }
              }
            }
          },
          include: {
            group: true,
            teacher: true,
            attendance: {
              where: {
                studentId: student.id
              }
            }
          },
          orderBy: { date: 'desc' }
        })
        
        console.log('\n🔍 Direct session query results:', directSessions.length, 'sessions')
        directSessions.forEach((session, index) => {
          console.log(`${index + 1}. ${session.date} - ${session.group.name} - ${session.title || 'No title'} (${session.status})`, {
            teacher: session.teacher.name,
            attendance: session.attendance.length > 0 ? session.attendance[0].status : 'No attendance'
          })
        })
      } else {
        console.log('❌ No student record found either')
      }
      
      return
    }
    
    const student = user.studentProfile
    console.log('📚 Groups:', student.groups.length)
    
    student.groups.forEach((groupStudent, index) => {
      const group = groupStudent.group
      console.log(`\n📖 Group ${index + 1}:`, {
        id: group.id,
        name: group.name,
        subject: group.subject,
        teacher: group.teacher.name,
        sessionsCount: group.sessions.length
      })
      
      console.log('📅 Sessions:')
      group.sessions.forEach((session, sessionIndex) => {
        const studentAttendance = session.attendance.find(att => att.studentId === student.id)
        console.log(`  ${sessionIndex + 1}. ${session.date} - ${session.title || 'No title'} (${session.status})`, {
          attendance: studentAttendance ? studentAttendance.status : 'No attendance'
        })
      })
    })
    
    // Also check sessions directly for this student
    const directSessions = await prisma.session.findMany({
      where: {
        group: {
          students: {
            some: {
              studentId: student.id
            }
          }
        }
      },
      include: {
        group: true,
        teacher: true,
        attendance: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: { date: 'desc' }
    })
    
    console.log('\n🔍 Direct session query results:', directSessions.length, 'sessions')
    directSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.date} - ${session.group.name} - ${session.title || 'No title'} (${session.status})`, {
        teacher: session.teacher.name,
        attendance: session.attendance.length > 0 ? session.attendance[0].status : 'No attendance'
      })
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStudentData()