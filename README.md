# Hugli Printing Press - Backend API

This is the backend API for the Hugli Printing Press web application, built with Express.js and MySQL.

## Features

- **Products Management**: CRUD operations for printing products
- **Order Management**: Handle customer orders with items and customer information
- **Contact Form**: Store and manage customer inquiries
- **MySQL Database**: Persistent data storage with proper relationships
- **RESTful API**: Clean and consistent API endpoints

## Prerequisites

Before running the backend, make sure you have:

1. **Node.js** (v14 or higher)
2. **MySQL Server** (v8.0 or higher)
3. **npm** or **yarn** package manager

## Installation

1. **Clone the repository** (if not already done)
2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Database Setup

### Option 1: Automatic Setup (Recommended)
The backend will automatically create the database and tables when you start the server, but you need to configure the database connection first.

### Option 2: Manual Setup
1. **Start MySQL server**
2. **Create a database**:
   ```sql
   CREATE DATABASE hugli_printing_db;
   ```
3. **Run the setup script**:
   ```bash
   mysql -u root -p hugli_printing_db < setup-database.sql
   ```

## Configuration

### Database Configuration
Update the database connection settings in `config/database.js`:

```javascript
const pool = mysql.createPool({
  host: 'localhost',        // Your MySQL host
  user: 'root',             // Your MySQL username
  password: 'your_password', // Your MySQL password
  database: 'hugli_printing_db', // Database name
  port: 3306                // MySQL port
});
```

### Environment Variables (Optional)
Create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=hugli_printing_db
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if the API is running

### Products
- **GET** `/api/products` - Get all products
- **GET** `/api/products/:id` - Get a specific product

### Orders
- **GET** `/api/orders` - Get all orders
- **GET** `/api/orders/:id` - Get a specific order
- **POST** `/api/orders` - Create a new order
- **PUT** `/api/orders/:id/status` - Update order status

### Contact
- **GET** `/api/contact` - Get all contact messages
- **POST** `/api/contact` - Submit a contact form
- **PUT** `/api/contact/:id/status` - Update contact message status

## API Usage Examples

### Create an Order
```javascript
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "name": "Visiting Cards",
      "description": "Professional visiting cards",
      "icon": "💼",
      "quantity": 2,
      "options": {
        "paperType": "Premium",
        "finish": "Matte"
      }
    }
  ],
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "ABC Corp"
  }
}
```

### Submit Contact Form
```javascript
POST /api/contact
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "XYZ Ltd",
  "subject": "Quote Request",
  "message": "I need a quote for 1000 visiting cards",
  "serviceType": "Visiting Cards"
}
```

## Database Schema

### Products Table
- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `category` - Product category
- `icon` - Emoji icon
- `image_url` - Product image URL
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Orders Table
- `id` - Primary key (UUID)
- `customer_name` - Customer name
- `customer_email` - Customer email
- `customer_phone` - Customer phone
- `customer_company` - Customer company
- `total_amount` - Order total
- `status` - Order status (pending, processing, completed, cancelled)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Order Items Table
- `id` - Primary key
- `order_id` - Foreign key to orders table
- `product_name` - Product name
- `product_description` - Product description
- `product_icon` - Product icon
- `quantity` - Item quantity
- `options` - JSON object with product options
- `created_at` - Creation timestamp

### Contact Messages Table
- `id` - Primary key
- `name` - Contact name
- `email` - Contact email
- `phone` - Contact phone
- `company` - Contact company
- `subject` - Message subject
- `message` - Message content
- `service_type` - Type of service inquired about
- `status` - Message status (new, read, replied)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Troubleshooting

### Database Connection Issues
1. Make sure MySQL server is running
2. Check database credentials in `config/database.js`
3. Ensure the database exists
4. Check firewall settings

### Port Already in Use
If port 5000 is already in use, you can change it by setting the PORT environment variable:
```bash
PORT=3001 npm start
```

### Permission Issues
Make sure your MySQL user has the necessary permissions:
```sql
GRANT ALL PRIVILEGES ON hugli_printing_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
