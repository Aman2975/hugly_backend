# Database Setup Guide

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hugly_printing
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Gmail SMTP)
GMAIL_USER=amankachura2975@gmail.com
GMAIL_APP_PASSWORD=ilsk pond lszj xjsi

# Frontend URL
REACT_APP_API_URL=http://localhost:5000/api
```

## Steps to Set Up:

### 1. Create .env File
```bash
cd backend
touch .env
```

### 2. Edit .env File
Open the `.env` file and add the configuration above, replacing:
- `your_mysql_password_here` with your actual MySQL password
- `your_jwt_secret_key_here` with a secure random string

### 3. Create Database
```sql
CREATE DATABASE hugly_printing;
```

### 4. Run Database Setup
```bash
node setup.js
```

### 5. Test Connection
```bash
node check-database-connection.js
```

## Common Issues:

1. **MySQL not running**: Start MySQL service
2. **Wrong password**: Check your MySQL root password
3. **Database doesn't exist**: Create the `hugly_printing` database
4. **Port conflicts**: Make sure port 3306 is available

## Quick Test:
```bash
node quick-db-check.js
```
