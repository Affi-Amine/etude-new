const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugEarnings() {
  try {
    console.log('=== DEBUGGING EARNINGS CALCULATION ===')
    
    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    console.log('Current month:', currentMonth, 'Current year:', currentYear)
    
    // Get all sessions for current month
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      },
      include: {
        group: true,
        attendance: true
      }
    })
    
    console.log('Sessions this month:', sessions.length)
    
    let totalEarnings = 0
    
    sessions.forEach(session => {
      const presentCount = session.attendance.filter(a => a.status === 'PRESENT').length
      const pricePerStudent = session.group?.sessionFee || (session.group?.monthlyFee ? session.group.monthlyFee / 4 : 0)
      const sessionEarning = presentCount * (pricePerStudent || 0)
      
      console.log(`Session ${session.id}:`)
      console.log(`  Date: ${session.date}`)
      console.log(`  Group: ${session.group?.name || 'Unknown'}`)
      console.log(`  Present: ${presentCount}`)
      console.log(`  Price per student: ${pricePerStudent} DT`)
      console.log(`  Session earning: ${sessionEarning} DT`)
      console.log('---')
      
      totalEarnings += sessionEarning
    })
    
    console.log('TOTAL EARNINGS THIS MONTH:', totalEarnings, 'DT')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEarnings()