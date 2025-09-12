const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Database Environment Setup');
  console.log('============================');
  console.log('');

  try {
    // Check if .env already exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists!');
      const overwrite = await question('Do you want to overwrite it? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    console.log('Please provide the following information:');
    console.log('');

    // Get database configuration
    const dbHost = await question('Database Host (default: localhost): ') || 'localhost';
    const dbUser = await question('Database User (default: root): ') || 'root';
    const dbPassword = await question('Database Password: ');
    const dbName = await question('Database Name (default: hugly_printing): ') || 'hugly_printing';
    const dbPort = await question('Database Port (default: 3306): ') || '3306';

    console.log('');
    console.log('Server Configuration:');
    const port = await question('Server Port (default: 5000): ') || '5000';
    const jwtSecret = await question('JWT Secret (default: random): ') || generateRandomString(32);

    console.log('');
    console.log('Email Configuration:');
    const gmailUser = await question('Gmail User (default: amankachura2975@gmail.com): ') || 'amankachura2975@gmail.com';
    const gmailPassword = await question('Gmail App Password (default: ilsk pond lszj xjsi): ') || 'ilsk pond lszj xjsi';

    // Create .env content
    const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
DB_PORT=${dbPort}

# Server Configuration
PORT=${port}
NODE_ENV=development

# JWT Secret
JWT_SECRET=${jwtSecret}

# Email Configuration (Gmail SMTP)
GMAIL_USER=${gmailUser}
GMAIL_APP_PASSWORD=${gmailPassword}

# Frontend URL
REACT_APP_API_URL=http://localhost:${port}/api
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('');
    console.log('✅ .env file created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Create the database: CREATE DATABASE ' + dbName + ';');
    console.log('3. Run: node setup.js');
    console.log('4. Test connection: node check-database-connection.js');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  } finally {
    rl.close();
  }
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

setupEnvironment();
