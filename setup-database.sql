-- Hugli Printing Press Database Setup
-- Run this script in MySQL to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS hugli_printing_db;
USE hugli_printing_db;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  icon VARCHAR(10),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create orders table
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
);

-- Create order_items table
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
);

-- Create contact_messages table
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
);

-- Insert sample products
INSERT INTO products (name, description, category, icon) VALUES
('Visiting Cards', 'Professional visiting cards for business networking', 'Business Cards', '💼'),
('Pamphlets & Posters', 'High-quality pamphlets and posters for marketing', 'Marketing', '📄'),
('Garment Tags', 'Custom garment tags and labels', 'Labels', '🏷️'),
('Files', 'Professional file folders and organizers', 'Office Supplies', '📁'),
('Letter Heads', 'Custom letterhead designs for business correspondence', 'Stationery', '📝'),
('Envelopes', 'Custom envelopes for professional mailing', 'Stationery', '✉️'),
('Digital Paper Printing', 'High-quality digital printing services', 'Printing', '🖨️'),
('ATM Pouches', 'Secure ATM pouches and banking supplies', 'Banking', '🏦'),
('Bill Books', 'Professional bill books and invoices', 'Business', '📋'),
('Stickers', 'Custom stickers and labels for various purposes', 'Labels', '🏷️');

-- Show tables
SHOW TABLES;

-- Show sample data
SELECT * FROM products;
