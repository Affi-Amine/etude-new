// Test script to verify sessions API is working correctly

async function testSessionsAPI() {
  try {
    console.log('🚀 Testing sessions API...');
    
    const response = await fetch('http://localhost:3000/api/sessions');
    
    if (!response.ok) {
      console.log('❌ Sessions API failed with status:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const sessions = await response.json();
    console.log('✅ Sessions API successful');
    console.log('Total sessions found:', sessions.length);
    
    if (sessions.length > 0) {
      console.log('\n📊 Session Statistics:');
      
      const completed = sessions.filter(s => s.status === 'COMPLETED').length;
      const scheduled = sessions.filter(s => s.status === 'SCHEDULED').length;
      const cancelled = sessions.filter(s => s.status === 'CANCELLED').length;
      
      console.log('- Completed sessions:', completed);
      console.log('- Scheduled sessions:', scheduled);
      console.log('- Cancelled sessions:', cancelled);
      
      console.log('\n📝 Sample session data:');
      const sampleSession = sessions[0];
      console.log('- ID:', sampleSession.id);
      console.log('- Date:', sampleSession.date);
      console.log('- Status:', sampleSession.status);
      console.log('- Group:', sampleSession.group?.name || 'No group');
      console.log('- Attendance records:', sampleSession.attendance?.length || 0);
      
      if (sampleSession.attendance && sampleSession.attendance.length > 0) {
        const presentCount = sampleSession.attendance.filter(a => a.status === 'PRESENT').length;
        console.log('- Present students:', presentCount);
      }
    } else {
      console.log('⚠️  No sessions found in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing sessions API:', error.message);
  }
}

testSessionsAPI();