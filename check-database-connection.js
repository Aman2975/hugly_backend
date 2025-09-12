const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseConnection() {
  console.log('🔍 Checking Database Connection...');
  console.log('='.repeat(50));

  // Display environment variables (without sensitive data)
  console.log('📋 Environment Variables:');
  console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
  console.log('DB_USER:', process.env.DB_USER || 'Not set');
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***hidden***' : 'Not set');
  console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
  console.log('DB_PORT:', process.env.DB_PORT || 'Not set');
  console.log('');

  // Check if all required environment variables are present
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('');
    console.log('💡 Please check your .env file and ensure all database variables are set.');
    return;
  }

  // Create connection pool
  const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  };

  console.log('🔧 Connection Configuration:');
  console.log('Host:', poolConfig.host);
  console.log('Port:', poolConfig.port);
  console.log('User:', poolConfig.user);
  console.log('Database:', poolConfig.database);
  console.log('');

  let connection;
  let pool;

  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Create connection pool
    pool = mysql.createPool(poolConfig);
    
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    console.log('✅ Database connection successful!');
    console.log('');

    // Test basic query
    console.log('🧪 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Basic query test passed:', rows[0]);
    console.log('');

    // Check database version
    console.log('📊 Database Information:');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL Version:', versionRows[0].version);
    console.log('');

    // List all tables
    console.log('📋 Available Tables:');
    const [tableRows] = await connection.execute('SHOW TABLES');
    if (tableRows.length > 0) {
      tableRows.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('   No tables found in the database.');
    }
    console.log('');

    // Check specific tables if they exist
    const importantTables = ['users', 'orders', 'order_items', 'contact_messages', 'otp_codes'];
    console.log('🔍 Checking Important Tables:');
    
    for (const tableName of importantTables) {
      try {
        const [tableInfo] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`✅ ${tableName}: ${tableInfo.length} columns`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`❌ ${tableName}: Table does not exist`);
        } else {
          console.log(`⚠️  ${tableName}: Error - ${error.message}`);
        }
      }
    }
    console.log('');

    // Test a simple insert/select/delete (if users table exists)
    try {
      console.log('🧪 Testing CRUD operations...');
      
      // Test insert
      const testEmail = `test_${Date.now()}@example.com`;
      const [insertResult] = await connection.execute(
        'INSERT INTO users (name, email, password, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test User', testEmail, 'hashed_password', 'customer', 'active', true]
      );
      console.log('✅ Insert test passed, ID:', insertResult.insertId);
      
      // Test select
      const [selectRows] = await connection.execute(
        'SELECT id, name, email FROM users WHERE email = ?',
        [testEmail]
      );
      console.log('✅ Select test passed, found:', selectRows.length, 'record(s)');
      
      // Test delete
      const [deleteResult] = await connection.execute(
        'DELETE FROM users WHERE email = ?',
        [testEmail]
      );
      console.log('✅ Delete test passed, deleted:', deleteResult.affectedRows, 'record(s)');
      
    } catch (error) {
      console.log('⚠️  CRUD test skipped:', error.message);
    }

    console.log('');
    console.log('🎉 Database connection test completed successfully!');
    console.log('✅ Your database is properly configured and accessible.');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.log('');
    
    // Provide troubleshooting tips
    console.log('🔧 Troubleshooting Tips:');
    console.log('1. Check if MySQL server is running');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Ensure database exists');
    console.log('4. Check firewall settings');
    console.log('5. Verify network connectivity');
    console.log('6. Check MySQL user permissions');
    
  } finally {
    // Close connections
    if (connection) {
      await connection.release();
      console.log('🔒 Connection released back to pool');
    }
    if (pool) {
      await pool.end();
      console.log('🔒 Connection pool closed');
    }
  }
}

// Run the check
checkDatabaseConnection()
  .then(() => {
    console.log('');
    console.log('✨ Database check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
