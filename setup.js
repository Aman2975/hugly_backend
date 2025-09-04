// Database setup script
const mysql = require('mysql2');
require('dotenv').config();

const setupDatabase = async () => {
  console.log('🚀 Setting up Hugli Printing Press Database...');
  
  // Create connection without specifying database
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  try {
    // Create database
    await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hugli_printing_db'}`);
    console.log('✅ Database created successfully');
    
    // Use the database
    await connection.promise().query(`USE ${process.env.DB_NAME || 'hugli_printing_db'}`);
    
    // Create tables
    await connection.promise().execute(`
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
    console.log('✅ Products table created');

    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        customer_company VARCHAR(255),
        delivery_type ENUM('pickup', 'delivery') DEFAULT 'pickup',
        delivery_address TEXT,
        delivery_date DATE,
        delivery_time VARCHAR(50),
        special_instructions TEXT,
        urgency ENUM('normal', 'urgent', 'rush') DEFAULT 'normal',
        contact_method ENUM('phone', 'email', 'whatsapp') DEFAULT 'phone',
        preferred_contact_time ENUM('morning', 'afternoon', 'evening', 'anytime') DEFAULT 'anytime',
        total_amount DECIMAL(10,2),
        status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    await connection.promise().execute(`
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
    console.log('✅ Order items table created');

    await connection.promise().execute(`
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
    console.log('✅ Contact messages table created');

    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(255),
        role ENUM('customer', 'admin') DEFAULT 'customer',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address_type ENUM('home', 'work', 'billing', 'shipping') DEFAULT 'home',
        full_name VARCHAR(255) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        phone VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ User addresses table created');

    // Insert sample products
    const [existingProducts] = await connection.promise().execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      const sampleProducts = [
        ['Visiting Cards', 'Professional visiting cards for business networking', 'Business Cards', '💼'],
        ['Pamphlets & Posters', 'High-quality pamphlets and posters for marketing', 'Marketing', '📄'],
        ['Garment Tags', 'Custom garment tags and labels', 'Labels', '🏷️'],
        ['Files', 'Professional file folders and organizers', 'Office Supplies', '📁'],
        ['Letter Heads', 'Custom letterhead designs for business correspondence', 'Stationery', '📝'],
        ['Envelopes', 'Custom envelopes for professional mailing', 'Stationery', '✉️'],
        ['Digital Paper Printing', 'High-quality digital printing services', 'Printing', '🖨️'],
        ['ATM Pouches', 'Secure ATM pouches and banking supplies', 'Banking', '🏦'],
        ['Bill Books', 'Professional bill books and invoices', 'Business', '📋'],
        ['Stickers', 'Custom stickers and labels for various purposes', 'Labels', '🏷️']
      ];

      for (const product of sampleProducts) {
        await connection.promise().execute(
          'INSERT INTO products (name, description, category, icon) VALUES (?, ?, ?, ?)',
          product
        );
      }
      console.log('✅ Sample products inserted');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('📝 You can now start the backend server with: npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('📝 Please check your MySQL configuration and try again.');
  } finally {
    connection.end();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
