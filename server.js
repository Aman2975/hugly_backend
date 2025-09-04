const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hugli_printing_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Hugli Printing Press API is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration request:', req.body);
    const { name, email, password, phone, company } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, company, status, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, company || null, 'active', 'customer']
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        email: email, 
        name: name,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User registered successfully:', email);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
        company: company || null,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ Inactive user:', email);
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, name, email, phone, company, role, status, created_at FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// ==================== USER ADDRESSES ENDPOINTS ====================

// Get user addresses
app.get('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const [addresses] = await pool.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.userId]
    );
    res.json(addresses);
  } catch (error) {
    console.error('❌ Addresses fetch error:', error);
    res.status(500).json({ message: 'Error fetching addresses' });
  }
});

// Add new address
app.post('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, country, is_default } = req.body;
    
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.userId]);
    }

    const [result] = await pool.execute(
      'INSERT INTO user_addresses (user_id, name, phone, address, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, name, phone, address, city || null, state || null, pincode || null, country || 'India', is_default || false]
    );

    res.status(201).json({
      message: 'Address added successfully',
      address: {
        id: result.insertId,
        user_id: req.user.userId,
        name,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        is_default
      }
    });
  } catch (error) {
    console.error('❌ Address add error:', error);
    res.status(500).json({ message: 'Error adding address' });
  }
});

// ==================== ORDERS ENDPOINTS ====================

// Create new order
app.post('/api/orders', async (req, res) => {
  console.log('🚀 Order creation request received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { items, customerInfo, deliveryInfo, preferences } = req.body;
    
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Validation failed: No items provided');
      return res.status(400).json({ 
        success: false,
        message: 'Order items are required' 
      });
    }
    
    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      console.log('❌ Validation failed: Missing customer info');
      return res.status(400).json({ 
        success: false,
        message: 'Customer name and email are required' 
      });
    }
    
    console.log('✅ Validation passed');
    
    // Generate order ID
    const orderId = uuidv4();
    console.log('🆔 Generated order ID:', orderId);
    
    // Start database transaction
    console.log('🔄 Starting database transaction...');
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert order
      console.log('💾 Inserting order into database...');
      await connection.execute(
        `INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, customer_company, customer_address,
          delivery_type, delivery_address, delivery_date, delivery_time, special_instructions,
          urgency, contact_method, preferred_contact_time, status, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          customerInfo.name,
          customerInfo.email,
          customerInfo.phone || null,
          customerInfo.company || null,
          customerInfo.address || null,
          deliveryInfo?.deliveryType || 'pickup',
          deliveryInfo?.deliveryAddress || null,
          deliveryInfo?.deliveryDate || null,
          deliveryInfo?.deliveryTime || null,
          deliveryInfo?.specialInstructions || null,
          preferences?.urgency || 'normal',
          preferences?.contactMethod || 'phone',
          preferences?.preferredContactTime || 'anytime',
          'pending',
          0.00
        ]
      );
      
      console.log('✅ Order inserted successfully, ID:', orderId);
      
      // Insert order items
      console.log('📋 Inserting order items...');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`  - Inserting item ${i + 1}: ${item.name}`);
        
        await connection.execute(
          `INSERT INTO order_items (
            order_id, product_name, product_description, product_icon, quantity, options
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.name,
            item.description || null,
            item.icon || null,
            parseInt(item.quantity) || 1,
            JSON.stringify(item.options || {})
          ]
        );
      }
      
      console.log('✅ All order items inserted successfully');
      
      // Commit transaction
      console.log('💾 Committing transaction...');
      await connection.commit();
      console.log('✅ Transaction committed successfully');
      
      // Fetch the complete order for response
      console.log('🔍 Fetching complete order details...');
      const [orderRows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
      const [itemRows] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      
      const completeOrder = {
        ...orderRows[0],
        items: itemRows.map(item => ({
          ...item,
          options: JSON.parse(item.options || '{}')
        }))
      };
      
      console.log('🎉 Order created successfully!');
      console.log('📊 Order summary:', {
        orderId: orderId,
        customerName: customerInfo.name,
        itemCount: items.length,
        status: 'pending'
      });
      
      // Send success response
      res.status(201).json({
        success: true,
        orderId: orderId,
        order: completeOrder,
        message: 'Order placed successfully!'
      });
      
    } catch (dbError) {
      // Rollback transaction on error
      console.log('❌ Database error, rolling back transaction...');
      await connection.rollback();
      console.error('Database error:', dbError.message);
      throw dbError;
    } finally {
      // Release connection
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Order creation failed:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    // First get all orders
    const [orders] = await pool.execute(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `);
    
    // Then get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.execute(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return {
          ...order,
          items: items.map(item => ({
            ...item,
            options: JSON.parse(item.options || '{}')
          }))
        };
      })
    );
    
    res.json({
      success: true,
      orders: ordersWithItems
    });
  } catch (error) {
    console.error('❌ Orders fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get user orders
app.get('/api/auth/orders', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching orders for user:', req.user.email);
    
    // First get user's orders
    const [orders] = await pool.execute(`
      SELECT * FROM orders 
      WHERE customer_email = ?
      ORDER BY created_at DESC
    `, [req.user.email]);
    
    console.log('📊 Found orders:', orders.length);
    
    // Check if orders exist
    if (!orders || orders.length === 0) {
      console.log('📭 No orders found for user');
      return res.json({
        success: true,
        orders: []
      });
    }
    
    // Then get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        console.log(`🔍 Fetching items for order: ${order.id}`);
        const [items] = await pool.execute(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        console.log(`📦 Found ${items.length} items for order ${order.id}`);
        
        return {
          ...order,
          items: items.map(item => ({
            ...item,
            options: JSON.parse(item.options || '{}')
          }))
        };
      })
    );
    
    console.log('✅ Successfully fetched orders with items');
    res.json({
      success: true,
      orders: ordersWithItems
    });
  } catch (error) {
    console.error('❌ User orders fetch error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders'
    });
  }
});

// ==================== PRODUCTS ENDPOINTS ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('❌ Products fetch error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// ==================== CONTACT ENDPOINTS ====================

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, serviceType } = req.body;
    
    // Only name is required
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, company, subject, message, service_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email || null, phone || null, company || null, subject || null, message || null, serviceType || null]
    );

    console.log(`📧 Contact message received from ${name} (${email || 'no email'})`);
    
    res.status(201).json({
      message: 'Contact message sent successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ message: 'Error submitting contact form' });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Admin login request:', { email });

    // Check if user exists and is admin
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful:', user.email);
    res.json({ 
      success: true, 
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    res.status(500).json({ success: false, message: 'Admin login failed' });
  }
});

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Admin token verification error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

// Get all orders for admin
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all orders...');
    
    // Get all orders
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.company as customer_company
      FROM orders o
      LEFT JOIN users u ON o.customer_email = u.email
      ORDER BY o.created_at DESC
    `);
    
    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    
    console.log(`✅ Admin fetched ${orders.length} orders`);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('❌ Admin orders fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// Get single order by ID for admin
app.get('/api/admin/orders/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`📋 Admin fetching order ${orderId}...`);
    
    // Get order with customer details
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.company as customer_company
      FROM orders o
      LEFT JOIN users u ON o.customer_email = u.email
      WHERE o.id = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Get order items
    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    
    // Parse JSON options for each item
    const parsedItems = items.map(item => ({
      ...item,
      options: JSON.parse(item.options || '{}')
    }));
    
    order.items = parsedItems;
    
    console.log(`✅ Admin fetched order ${orderId} with ${items.length} items`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Admin order fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

// Update order status
app.put('/api/admin/orders/:orderId/status', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Admin updating order ${orderId} status to ${status}`);
    
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    console.log(`✅ Order ${orderId} status updated to ${status}`);
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('❌ Order status update error:', error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// Get all users for admin
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    console.log('👥 Admin fetching all users...');
    
    const [users] = await pool.execute(`
      SELECT id, name, email, phone, company, status, role, created_at
      FROM users 
      WHERE role = 'customer'
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Admin fetched ${users.length} users`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Admin users fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Delete single order (admin only)
app.delete('/api/admin/orders/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete order items first (foreign key constraint)
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      
      // Delete the order
      const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      await connection.commit();
      console.log(`🗑️ Order ${orderId} deleted successfully`);
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Order delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting order' });
  }
});

// Delete orders by status (admin only)
app.delete('/api/admin/orders/status/:status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.params;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get orders with this status
      const [orders] = await connection.execute('SELECT id FROM orders WHERE status = ?', [status]);
      
      if (orders.length === 0) {
        await connection.rollback();
        return res.json({ success: true, message: 'No orders found with this status', deletedCount: 0 });
      }
      
      // Delete order items first
      for (const order of orders) {
        await connection.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      }
      
      // Delete the orders
      const [result] = await connection.execute('DELETE FROM orders WHERE status = ?', [status]);
      
      await connection.commit();
      console.log(`🗑️ Deleted ${result.affectedRows} orders with status: ${status}`);
      res.json({ success: true, message: `Deleted ${result.affectedRows} orders with status: ${status}`, deletedCount: result.affectedRows });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Bulk order delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting orders by status' });
  }
});

// Delete single user (admin only)
app.delete('/api/admin/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get user's orders first
      const [orders] = await connection.execute('SELECT id FROM orders WHERE user_id = ?', [userId]);
      
      // Delete order items for user's orders
      for (const order of orders) {
        await connection.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
      }
      
      // Delete user's orders
      await connection.execute('DELETE FROM orders WHERE user_id = ?', [userId]);
      
      // Delete user's addresses
      await connection.execute('DELETE FROM user_addresses WHERE user_id = ?', [userId]);
      
      // Delete the user
      const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      await connection.commit();
      console.log(`🗑️ User ${userId} and all related data deleted successfully`);
      res.json({ success: true, message: 'User and all related data deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ User delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// ==================== ADMIN CONTACT ENDPOINTS ====================

// Get all contact messages (admin only)
app.get('/api/admin/contacts', authenticateAdmin, async (req, res) => {
  try {
    const [contacts] = await pool.execute(`
      SELECT id, name, email, phone, company, subject, message, service_type, status, created_at, updated_at
      FROM contact_messages 
      ORDER BY created_at DESC
    `);
    
    console.log(`📧 Admin fetched ${contacts.length} contact messages`);
    res.json({ success: true, contacts });
  } catch (error) {
    console.error('❌ Admin contacts fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching contact messages' });
  }
});

// Update contact message status (admin only)
app.put('/api/admin/contacts/:contactId/status', authenticateAdmin, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status } = req.body;
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const [result] = await pool.execute(
      'UPDATE contact_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, contactId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }
    
    console.log(`📧 Contact message ${contactId} status updated to ${status}`);
    res.json({ success: true, message: 'Contact status updated successfully' });
  } catch (error) {
    console.error('❌ Contact status update error:', error);
    res.status(500).json({ success: false, message: 'Error updating contact status' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});



// Start server
app.listen(PORT, () => {
  console.log('🚀 Hugli Printing Press Server Started!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log('✅ Ready to handle all requests');
  console.log('📋 Available endpoints:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - GET  /api/auth/profile');
  console.log('  - GET  /api/auth/addresses');
  console.log('  - POST /api/auth/addresses');
  console.log('  - POST /api/orders');
  console.log('  - GET  /api/orders');
  console.log('  - GET  /api/auth/orders');
  console.log('  - GET  /api/products');
  console.log('  - POST /api/contact');
  console.log('  - POST /api/admin/login');
  console.log('  - GET  /api/admin/orders');
  console.log('  - PUT  /api/admin/orders/:id/status');
  console.log('  - GET  /api/admin/users');
  console.log('  - GET  /api/admin/contacts');
  console.log('  - PUT  /api/admin/contacts/:id/status');
  console.log('  - DELETE /api/admin/orders/:id');
  console.log('  - DELETE /api/admin/orders/status/:status');
  console.log('  - DELETE /api/admin/users/:id');
});
