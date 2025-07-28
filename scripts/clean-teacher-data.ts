import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanTeacherData(teacherEmail: string) {
  console.log(`🧹 Cleaning all data for teacher: ${teacherEmail}`)

  try {
    // Find the teacher
    const teacher = await prisma.user.findUnique({
      where: { email: teacherEmail }
    })

    if (!teacher) {
      console.log('❌ Teacher not found')
      return
    }

    console.log(`Found teacher: ${teacher.name} (ID: ${teacher.id})`)

    // Get all groups for this teacher
    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.id },
      include: {
        students: true,
        sessions: {
          include: {
            attendance: true
          }
        },
        payments: true
      }
    })

    console.log(`Found ${groups.length} groups to clean`)

    // Clean data in the correct order (respecting foreign key constraints)
    for (const group of groups) {
      console.log(`Cleaning group: ${group.name}`)

      // Delete attendance records
      for (const session of group.sessions) {
        await prisma.attendance.deleteMany({
          where: { sessionId: session.id }
        })
      }

      // Delete sessions
      await prisma.session.deleteMany({
        where: { groupId: group.id }
      })

      // Delete payments
      await prisma.payment.deleteMany({
        where: { groupId: group.id }
      })

      // Delete group-student relationships
      await prisma.groupStudent.deleteMany({
        where: { groupId: group.id }
      })

      // Delete the group
      await prisma.group.delete({
        where: { id: group.id }
      })
    }

    // Delete all students created by this teacher
    await prisma.student.deleteMany({
      where: { teacherId: teacher.id }
    })

    console.log('✅ All data cleaned successfully!')
    console.log(`Teacher ${teacher.name} now has a fresh account ready for testing.`)

  } catch (error) {
    console.error('❌ Error cleaning teacher data:', error)
    throw error
  }
}

async function main() {
  const teacherEmail = process.argv[2] || 'ahmed.ben.salem@gmail.com'
  await cleanTeacherData(teacherEmail)
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { cleanTeacherData }