const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickDatabaseCheck() {
  console.log('🚀 Quick Database Connection Check');
  console.log('================================');

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database successfully!');
    
    // Test query
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    console.log('⏰ Current time:', rows[0].current_time);
    
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables found:', tables.length);
    
    await connection.end();
    console.log('✅ Connection closed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('');
    console.log('🔧 Check your .env file for:');
    console.log('   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  }
}

quickDatabaseCheck();
