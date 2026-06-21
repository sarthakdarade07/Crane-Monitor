const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = res.data.token;
    console.log("Logged in!");

    const start = Date.now();
    const users = await axios.get('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Fetched users in ${Date.now() - start}ms:`, users.data.length);

    const start2 = Date.now();
    const readings = await axios.get('http://localhost:3001/api/readings/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Fetched readings in ${Date.now() - start2}ms:`, readings.data.length);

  } catch(e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
test();
