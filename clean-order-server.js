const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create MySQL connection pool directly (without initialization)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hugli_printing_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Clean Order Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Order creation endpoint
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
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert order
      console.log('💾 Inserting order into database...');
      await connection.execute(
        `INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, customer_company,
          delivery_type, delivery_address, delivery_date, delivery_time, special_instructions,
          urgency, contact_method, preferred_contact_time, status, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          customerInfo.name,
          customerInfo.email,
          customerInfo.phone || null,
          customerInfo.company || null,
          deliveryInfo?.deliveryType || 'pickup',
          deliveryInfo?.deliveryAddress || null,
          deliveryInfo?.deliveryDate || null,
          deliveryInfo?.deliveryTime || null,
          deliveryInfo?.specialInstructions || null,
          preferences?.urgency || 'normal',
          preferences?.contactMethod || 'phone',
          preferences?.preferredContactTime || 'anytime',
          'pending',
          0
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
      const [orderRows] = await promisePool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
      const [itemRows] = await promisePool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      
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

// Get all orders endpoint (for testing)
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await promisePool.execute(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'product_name', oi.product_name,
                 'product_description', oi.product_description,
                 'product_icon', oi.product_icon,
                 'quantity', oi.quantity,
                 'options', oi.options
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Clean Order Server Started!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log('✅ Ready to handle order requests');
  console.log('📋 Available endpoints:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/orders');
  console.log('  - GET  /api/orders');
});

module.exports = app;
