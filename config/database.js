const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hugli_printing_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove invalid configuration options
  // acquireTimeout: 60000,
  // timeout: 60000,
  // reconnect: true
});

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1 as test');
    console.log('✅ MySQL database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist
    await promisePool.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hugli_printing_db'}`);
    await promisePool.execute(`USE ${process.env.DB_NAME || 'hugli_printing_db'}`);

    // Create products table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        icon VARCHAR(10),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        customer_company VARCHAR(255),
        total_amount DECIMAL(10,2),
        status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        product_icon VARCHAR(10),
        quantity INT NOT NULL,
        options JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create contact_messages table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        company VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        service_type VARCHAR(100),
        status ENUM('new', 'read', 'replied') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Insert sample data
const insertSampleData = async () => {
  try {
    // Check if products already exist
    const [existingProducts] = await promisePool.execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      const sampleProducts = [
        {
          name: 'Visiting Cards',
          description: 'Professional visiting cards for business networking',
          category: 'Business Cards',
          icon: '💼'
        },
        {
          name: 'Pamphlets & Posters',
          description: 'High-quality pamphlets and posters for marketing',
          category: 'Marketing',
          icon: '📄'
        },
        {
          name: 'Garment Tags',
          description: 'Custom garment tags and labels',
          category: 'Labels',
          icon: '🏷️'
        },
        {
          name: 'Files',
          description: 'Professional file folders and organizers',
          category: 'Office Supplies',
          icon: '📁'
        },
        {
          name: 'Letter Heads',
          description: 'Custom letterhead designs for business correspondence',
          category: 'Stationery',
          icon: '📝'
        },
        {
          name: 'Envelopes',
          description: 'Custom envelopes for professional mailing',
          category: 'Stationery',
          icon: '✉️'
        },
        {
          name: 'Digital Paper Printing',
          description: 'High-quality digital printing services',
          category: 'Printing',
          icon: '🖨️'
        },
        {
          name: 'ATM Pouches',
          description: 'Secure ATM pouches and banking supplies',
          category: 'Banking',
          icon: '🏦'
        },
        {
          name: 'Bill Books',
          description: 'Professional bill books and invoices',
          category: 'Business',
          icon: '📋'
        },
        {
          name: 'Stickers',
          description: 'Custom stickers and labels for various purposes',
          category: 'Labels',
          icon: '🏷️'
        }
      ];

      for (const product of sampleProducts) {
        await promisePool.execute(
          'INSERT INTO products (name, description, category, icon) VALUES (?, ?, ?, ?)',
          [product.name, product.description, product.category, product.icon]
        );
      }

      console.log('✅ Sample data inserted successfully');
    }
  } catch (error) {
    console.error('❌ Sample data insertion failed:', error.message);
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  initializeDatabase,
  insertSampleData
};
