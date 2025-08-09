const fetch = require('node-fetch')

async function testStudentLoginAPI() {
  try {
    console.log('🔐 Testing student login API...')
    
    const loginData = {
      email: 'affi.amin.work@gmail.com',
      password: 'password123' // Default password from our test data
    }
    
    console.log('📤 Sending login request:', {
      email: loginData.email,
      password: '***hidden***'
    })
    
    const response = await fetch('http://localhost:3001/api/auth/student-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📥 Raw response:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message)
      return
    }
    
    if (!response.ok) {
      console.log('❌ Login failed:', data.error || 'Unknown error')
      return
    }
    
    console.log('✅ Login successful!')
    console.log('👤 Student data received:', {
      id: data.student?.id,
      name: data.student?.name,
      email: data.student?.email,
      hasGroups: data.student?.groups?.length > 0,
      groupsCount: data.student?.groups?.length || 0
    })
    
    if (data.student?.groups) {
      console.log('📚 Groups:')
      data.student.groups.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group.name} (${group.subject})`)
      })
    }
    
    console.log('\n🎯 Now testing session fetch with student data...')
    
    // Test fetching sessions (this would normally be done with cookies/session)
    const sessionsResponse = await fetch(`http://localhost:3001/api/student/sessions?studentId=${data.student.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('📅 Sessions API status:', sessionsResponse.status)
    
    if (sessionsResponse.ok) {
      const sessionsData = await sessionsResponse.json()
      console.log('📅 Sessions found:', sessionsData.sessions?.length || 0)
      
      if (sessionsData.sessions?.length > 0) {
        console.log('📋 Sample sessions:')
        sessionsData.sessions.slice(0, 3).forEach((session, index) => {
          console.log(`  ${index + 1}. ${new Date(session.date).toLocaleDateString()} - ${session.group.name} - ${session.title || 'No title'} (${session.status})`)
        })
      }
    } else {
      const errorData = await sessionsResponse.text()
      console.log('❌ Sessions API error:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Error testing login API:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running on http://localhost:3001')
    }
  }
}

testStudentLoginAPI()