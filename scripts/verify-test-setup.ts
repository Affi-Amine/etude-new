import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TEACHER_EMAIL = 'ahmed.ben.salem@gmail.com'

async function verifyTestSetup() {
  console.log('🔍 Verifying test setup for Ahmed Ben Salem...')
  console.log('=' .repeat(50))

  try {
    const teacher = await prisma.user.findUnique({
      where: { email: TEACHER_EMAIL },
      include: {
        groups: {
          include: {
            students: {
              include: {
                student: true
              }
            },
            sessions: {
              include: {
                attendance: {
                  include: {
                    student: true
                  }
                }
              }
            },
            payments: {
              include: {
                student: true
              }
            }
          }
        },
        students: true
      }
    })

    if (!teacher) {
      console.log('❌ Teacher not found!')
      return
    }

    console.log(`👨‍🏫 Teacher: ${teacher.name} (${teacher.email})`)
    console.log(`📧 Status: ${teacher.status} | Role: ${teacher.role}`)
    console.log()

    // Groups Summary
    console.log(`📚 Groups: ${teacher.groups.length}`)
    teacher.groups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.name} (${group.subject})`)
      console.log(`      📅 Schedule: ${group.scheduleDay} at ${group.scheduleTime} (${group.scheduleDuration}min)`)
      console.log(`      💰 Monthly Fee: ${group.monthlyFee}DT | Session Fee: ${group.sessionFee || 'N/A'}DT`)
      console.log(`      👥 Students: ${group.students.length}`)
      console.log(`      📝 Sessions: ${group.sessions.length}`)
      console.log(`      💳 Payments: ${group.payments.length}`)
      console.log()
    })

    // Students Summary
    console.log(`👥 Total Students: ${teacher.students.length}`)
    teacher.students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.classe})`)
      console.log(`      📱 Phone: ${student.phone}`)
      console.log(`      🏫 School: ${student.lycee}`)
      console.log()
    })

    // Sessions Summary
    const allSessions = teacher.groups.flatMap(g => g.sessions)
    console.log(`📝 Total Sessions: ${allSessions.length}`)
    allSessions.forEach((session, index) => {
      const group = teacher.groups.find(g => g.id === session.groupId)
      console.log(`   ${index + 1}. ${group?.name} - ${session.date.toLocaleDateString()}`)
      console.log(`      ⏱️  Duration: ${session.duration}min | Status: ${session.status}`)
      console.log(`      👥 Attendance: ${session.attendance.length} records`)
      session.attendance.forEach(att => {
        console.log(`         - ${att.student.name}: ${att.status}`)
      })
      console.log()
    })

    // Payments Summary
    const allPayments = teacher.groups.flatMap(g => g.payments)
    console.log(`💳 Total Payments: ${allPayments.length}`)
    allPayments.forEach((payment, index) => {
      const group = teacher.groups.find(g => g.id === payment.groupId)
      console.log(`   ${index + 1}. ${payment.student.name} - ${group?.name}`)
      console.log(`      💰 Amount: ${payment.amount}DT | Type: ${payment.type}`)
      console.log(`      📅 Due: ${payment.dueDate.toLocaleDateString()} | Status: ${payment.status}`)
      if (payment.paidDate) {
        console.log(`      ✅ Paid: ${payment.paidDate.toLocaleDateString()}`)
      }
      console.log()
    })

    console.log('=' .repeat(50))
    console.log('✅ Test setup verification complete!')
    console.log()
    console.log('🎯 Ready for manual testing:')
    console.log('   1. Login with: ahmed.ben.salem@gmail.com / teacher123')
    console.log('   2. Navigate to Groups page to see the test group')
    console.log('   3. Check Students page to see enrolled students')
    console.log('   4. View Calendar to see scheduled sessions')
    console.log('   5. Check Payments page to see payment records')
    console.log('   6. Test creating new groups, students, and sessions')
    console.log('   7. Test attendance tracking and payment management')
    console.log()
    console.log('🌐 Application URL: http://localhost:3001')

  } catch (error) {
    console.error('❌ Error during verification:', error)
  }
}

async function main() {
  await verifyTestSetup()
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Verification failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { verifyTestSetup }