import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3001'

// Test credentials
const TEACHER_EMAIL = 'ahmed.ben.salem@gmail.com'
const TEACHER_PASSWORD = 'teacher123'

interface TestResult {
  feature: string
  status: 'PASS' | 'FAIL'
  message: string
  data?: any
}

class FeatureTester {
  private results: TestResult[] = []
  private authToken: string = ''

  async runAllTests() {
    console.log('🧪 Starting comprehensive feature testing...')
    console.log('=' .repeat(60))

    try {
      // 1. Authentication Test
      await this.testAuthentication()
      
      // 2. Group Creation Test
      const groupId = await this.testGroupCreation()
      
      // 3. Student Management Test
      const studentIds = await this.testStudentManagement(groupId)
      
      // 4. Session Scheduling Test
      const sessionId = await this.testSessionScheduling(groupId)
      
      // 5. Attendance Tracking Test
      await this.testAttendanceTracking(sessionId, studentIds)
      
      // 6. Payment Management Test
      await this.testPaymentManagement(groupId, studentIds)
      
      // 7. Dashboard and Analytics Test
      await this.testDashboardFeatures()
      
    } catch (error) {
      this.addResult('GENERAL', 'FAIL', `Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    }

    this.printResults()
  }

  private addResult(feature: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
    this.results.push({ feature, status, message, data })
    const emoji = status === 'PASS' ? '✅' : '❌'
    console.log(`${emoji} ${feature}: ${message}`)
  }

  private async testAuthentication() {
    try {
      // Test login endpoint
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEACHER_EMAIL,
          password: TEACHER_PASSWORD
        })
      })

      if (response.ok) {
        this.addResult('Authentication', 'PASS', 'Teacher login successful')
      } else {
        this.addResult('Authentication', 'FAIL', `Login failed: ${response.status}`)
      }
    } catch (error) {
      this.addResult('Authentication', 'FAIL', `Login error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async testGroupCreation(): Promise<string | null> {
    try {
      // Test group creation via database (simulating API call)
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL }
      })

      if (!teacher) {
        this.addResult('Group Creation', 'FAIL', 'Teacher not found')
        return null
      }

      const group = await prisma.group.create({
        data: {
          name: 'Test Math Group',
          subject: 'Mathématiques',
          scheduleDay: 'Lundi',
          scheduleTime: '14:00',
          scheduleDuration: 90,
          monthlyFee: 120,
          sessionFee: 30,
          registrationFee: 50,
          paymentDeadline: 30,
          teacherId: teacher.id
        }
      })

      this.addResult('Group Creation', 'PASS', `Group created successfully: ${group.name}`, { groupId: group.id })
      return group.id
    } catch (error) {
      this.addResult('Group Creation', 'FAIL', `Group creation failed: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private async testStudentManagement(groupId: string | null): Promise<string[]> {
    if (!groupId) {
      this.addResult('Student Management', 'FAIL', 'No group available for testing')
      return []
    }

    try {
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL }
      })

      // Create test students
      const students = await Promise.all([
        prisma.student.create({
          data: {
            name: 'Ahmed Khalil',
            phone: '+216 20 123 456',
            classe: '4ème Math',
            lycee: 'Lycée Pilote Ariana',
            teacherId: teacher!.id
          }
        }),
        prisma.student.create({
          data: {
            name: 'Fatma Ben Ali',
            phone: '+216 25 789 012',
            classe: '4ème Math',
            lycee: 'Lycée Pilote Ariana',
            teacherId: teacher!.id
          }
        })
      ])

      // Add students to group
      await Promise.all(
        students.map(student => 
          prisma.groupStudent.create({
            data: {
              groupId,
              studentId: student.id,
              teacherId: teacher!.id,
              isActive: true
            }
          })
        )
      )

      this.addResult('Student Management', 'PASS', `Created and enrolled ${students.length} students`, 
        { studentIds: students.map(s => s.id) })
      return students.map(s => s.id)
    } catch (error) {
      this.addResult('Student Management', 'FAIL', `Student management failed: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  private async testSessionScheduling(groupId: string | null): Promise<string | null> {
    if (!groupId) {
      this.addResult('Session Scheduling', 'FAIL', 'No group available for testing')
      return null
    }

    try {
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL }
      })

      // Create a test session
      const session = await prisma.session.create({
        data: {
          groupId,
          teacherId: teacher!.id,
          date: new Date('2024-01-15T14:00:00Z'),
          duration: 90,
          status: 'SCHEDULED',
          notes: 'Test session for feature verification'
        }
      })

      this.addResult('Session Scheduling', 'PASS', `Session scheduled successfully`, { sessionId: session.id })
      return session.id
    } catch (error) {
      this.addResult('Session Scheduling', 'FAIL', `Session scheduling failed: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private async testAttendanceTracking(sessionId: string | null, studentIds: string[]) {
    if (!sessionId || studentIds.length === 0) {
      this.addResult('Attendance Tracking', 'FAIL', 'No session or students available for testing')
      return
    }

    try {
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL }
      })

      // Create attendance records
      const attendanceRecords = await Promise.all(
        studentIds.map((studentId, index) => 
          prisma.attendance.create({
            data: {
              sessionId,
              studentId,
              teacherId: teacher!.id,
              status: index % 2 === 0 ? 'PRESENT' : 'ABSENT', // Alternate present/absent
              notes: index % 2 === 0 ? 'Present and engaged' : 'Absent - family emergency'
            }
          })
        )
      )

      // Update session status to completed
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' }
      })

      this.addResult('Attendance Tracking', 'PASS', 
        `Attendance recorded for ${attendanceRecords.length} students`, 
        { attendanceCount: attendanceRecords.length })
    } catch (error) {
      this.addResult('Attendance Tracking', 'FAIL', `Attendance tracking failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async testPaymentManagement(groupId: string | null, studentIds: string[]) {
    if (!groupId || studentIds.length === 0) {
      this.addResult('Payment Management', 'FAIL', 'No group or students available for testing')
      return
    }

    try {
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL }
      })

      // Create payment records
      const payments = await Promise.all(
        studentIds.map(studentId => 
          prisma.payment.create({
            data: {
              studentId,
              groupId,
              teacherId: teacher!.id,
              amount: 120, // Monthly fee
              type: 'MONTHLY_FEE',
              status: 'PAID',
              dueDate: new Date('2024-01-31'),
              paidDate: new Date(),
              notes: 'Test payment for feature verification'
            }
          })
        )
      )

      this.addResult('Payment Management', 'PASS', 
        `Payment records created for ${payments.length} students`, 
        { paymentCount: payments.length })
    } catch (error) {
      this.addResult('Payment Management', 'FAIL', `Payment management failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async testDashboardFeatures() {
    try {
      const teacher = await prisma.user.findUnique({
        where: { email: TEACHER_EMAIL },
        include: {
          groups: {
            include: {
              students: true,
              sessions: true,
              payments: true
            }
          }
        }
      })

      if (!teacher) {
        this.addResult('Dashboard Features', 'FAIL', 'Teacher not found')
        return
      }

      // Calculate dashboard stats
      const totalGroups = teacher.groups.length
      const totalStudents = teacher.groups.reduce((sum, group) => sum + group.students.length, 0)
      const totalSessions = teacher.groups.reduce((sum, group) => sum + group.sessions.length, 0)
      const totalPayments = teacher.groups.reduce((sum, group) => sum + group.payments.length, 0)

      this.addResult('Dashboard Features', 'PASS', 
        `Dashboard data calculated successfully`, 
        { totalGroups, totalStudents, totalSessions, totalPayments })
    } catch (error) {
      this.addResult('Dashboard Features', 'FAIL', `Dashboard features failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private printResults() {
    console.log('\n' + '=' .repeat(60))
    console.log('📊 TEST RESULTS SUMMARY')
    console.log('=' .repeat(60))

    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length

    console.log(`\n✅ Passed: ${passed}/${total}`)
    console.log(`❌ Failed: ${failed}/${total}`)
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.feature}: ${r.message}`))
    }

    console.log('\n🎯 FEATURE STATUS:')
    this.results.forEach(r => {
      const emoji = r.status === 'PASS' ? '✅' : '❌'
      console.log(`   ${emoji} ${r.feature}`)
    })

    console.log('\n' + '=' .repeat(60))
  }
}

async function main() {
  const tester = new FeatureTester()
  await tester.runAllTests()
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Test execution failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { FeatureTester }