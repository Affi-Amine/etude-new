const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Creating test data...');
  
  try {
    // Find or create Professor Fatma
    let teacher = await prisma.user.findUnique({
      where: { email: 'fatma.trabelsi@gmail.com' }
    });

    if (!teacher) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      teacher = await prisma.user.create({
        data: {
          name: 'Fatma Trabelsi',
          email: 'fatma.trabelsi@gmail.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Created teacher: Fatma Trabelsi');
    } else {
      console.log('✅ Using existing teacher: Fatma Trabelsi');
    }

    // Find the student Amine Affi (first find the user, then the student profile)
    const studentUser = await prisma.user.findUnique({
      where: { email: 'affi.amin.work@gmail.com' }
    });

    if (!studentUser) {
      console.log('❌ Student user Amine Affi not found!');
      return;
    }

    // Find the student profile
    const student = await prisma.student.findUnique({
      where: { userId: studentUser.id }
    });

    if (!student) {
      console.log('❌ Student profile for Amine Affi not found!');
      return;
    }

    console.log('✅ Found student: Amine Affi');

    // Create or find a group
    let group = await prisma.group.findFirst({
      where: {
        teacherId: teacher.id,
        name: 'Mathématiques Terminale'
      }
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Mathématiques Terminale',
          subject: 'Mathématiques',
          scheduleDay: 'MONDAY',
          scheduleTime: '14:00',
          scheduleDuration: 120,
          monthlyFee: 200,
          sessionFee: 50,
          paymentThreshold: 4,
          teacherId: teacher.id,
          isActive: true
        }
      });
      console.log('✅ Created group: Mathématiques Terminale');
    } else {
      console.log('✅ Using existing group: Mathématiques Terminale');
    }

    // Add student to the group if not already added
    const existingGroupStudent = await prisma.groupStudent.findFirst({
      where: {
        studentId: student.id,
        groupId: group.id
      }
    });

    if (!existingGroupStudent) {
      await prisma.groupStudent.create({
        data: {
          studentId: student.id,
          groupId: group.id,
          teacherId: teacher.id,
          isActive: true
        }
      });
      console.log('✅ Added student to group');
    } else {
      console.log('✅ Student already in group');
    }

    // Create test sessions
    const now = new Date();
    const sessions = [];
    
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() - (i * 7)); // Weekly sessions going back
      
      const existingSession = await prisma.session.findFirst({
        where: {
          groupId: group.id,
          date: {
            gte: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate()),
            lt: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate() + 1)
          }
        }
      });

      if (!existingSession) {
        const session = await prisma.session.create({
          data: {
            groupId: group.id,
            teacherId: teacher.id,
            date: sessionDate,
            duration: group.scheduleDuration || 120,
            status: i === 0 ? 'SCHEDULED' : 'COMPLETED',
            title: `Session ${i + 1} - Mathématiques`,
            description: `Session de mathématiques - Chapitre ${i + 1}`,
            objectives: [
              `Objectif ${i + 1}.1`,
              `Objectif ${i + 1}.2`
            ],
            materials: [
              'Calculatrice',
              'Cahier d\'exercices'
            ],
            homework: i < 4 ? `Exercices page ${20 + i * 5} à ${25 + i * 5}` : null
          }
        });
        
        sessions.push(session);
        
        // Create attendance for completed sessions
        if (session.status === 'COMPLETED') {
          await prisma.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              teacherId: teacher.id,
              status: 'PRESENT',
              notes: 'Participation active'
            }
          });
        }
      }
    }

    console.log(`✅ Created ${sessions.length} new test sessions`);
    console.log('\n🎉 Test data creation completed!');
    console.log('\n📋 You can now test with:');
    console.log('Student: affi.amin.work@gmail.com / student123');
    console.log('Teacher: fatma.trabelsi@gmail.com / teacher123');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };