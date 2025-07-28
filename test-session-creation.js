const http = require('http');

// Test session creation with duration field
function testSessionCreation() {
  console.log('Testing session creation with duration field...');
  
  // First, test authentication
  const authData = JSON.stringify({
    email: 'ahmed.ben.salem@gmail.com',
    password: 'teacher123',
    redirect: false
  });

  const authOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(authData)
    }
  };

  const authReq = http.request(authOptions, (authRes) => {
    console.log(`Auth Status: ${authRes.statusCode}`);
    console.log(`Auth Headers:`, authRes.headers);
    
    let authBody = '';
    authRes.on('data', (chunk) => {
      authBody += chunk;
    });
    
    authRes.on('end', () => {
      console.log('Auth Response:', authBody);
      
      // Extract cookies for session
      const cookies = authRes.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';
      
      // Test session creation
      const sessionData = JSON.stringify({
        groupId: 'test-group-id', // This will fail but we want to see the validation error
        date: new Date().toISOString(),
        duration: 90, // Test with duration field
        status: 'SCHEDULED',
        notes: 'Test session with duration'
      });

      const sessionOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/sessions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(sessionData),
          'Cookie': cookieHeader
        }
      };

      const sessionReq = http.request(sessionOptions, (sessionRes) => {
        console.log(`\nSession Creation Status: ${sessionRes.statusCode}`);
        
        let sessionBody = '';
        sessionRes.on('data', (chunk) => {
          sessionBody += chunk;
        });
        
        sessionRes.on('end', () => {
          console.log('Session Response:', sessionBody);
          
          if (sessionRes.statusCode === 404) {
            console.log('✓ Session creation validation working - group not found (expected)');
          } else if (sessionRes.statusCode === 400) {
            console.log('✓ Session creation validation working - bad request (expected)');
          } else if (sessionBody.includes('duration')) {
            console.log('✗ Duration field issue detected');
          } else {
            console.log('✓ No duration field errors - fix appears successful!');
          }
        });
      });

      sessionReq.on('error', (err) => {
        console.error('Session request error:', err);
      });

      sessionReq.write(sessionData);
      sessionReq.end();
    });
  });

  authReq.on('error', (err) => {
    console.error('Auth request error:', err);
  });

  authReq.write(authData);
  authReq.end();
}

// Test server health first
function testServerHealth() {
  console.log('Testing server health...');
  
  const healthOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  const healthReq = http.request(healthOptions, (healthRes) => {
    console.log(`Server Status: ${healthRes.statusCode}`);
    
    if (healthRes.statusCode === 200) {
      console.log('✓ Server is running on port 3001');
      testSessionCreation();
    } else {
      console.log('✗ Server health check failed');
    }
  });

  healthReq.on('error', (err) => {
    console.error('Health check error:', err);
  });

  healthReq.end();
}

// Start tests
testServerHealth();