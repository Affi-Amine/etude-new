const fs = require('fs')

async function testAPI() {
  try {
    // Read cookies
    const cookies = fs.readFileSync('cookies.txt', 'utf8').trim()
    
    console.log('Calling API...')
    const response = await fetch('http://localhost:3000/api/dashboard/stats', {
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log('Response not OK:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('Total earnings this month:', data.totalEarningsThisMonth)
    console.log('Total students:', data.totalStudents)
    console.log('Total groups:', data.totalGroups)
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()