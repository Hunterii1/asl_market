# ASL Market Backend

Backend API for ASL Market built with Go, Gin, GORM, and JWT authentication.

## Features

- JWT Authentication (Login/Register)
- User Management
- Protected and Public Routes
- MySQL Database with GORM
- CORS Support
- Configuration with Viper

## Prerequisites

- Go 1.21+
- MySQL 8.0+
- Git

## Setup

1. **Clone and Navigate**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   go mod tidy
   ```

3. **Database Setup**
   
   **Option A: Automated Setup (Recommended)**
   ```bash
   # On Windows
   cd backend/scripts
   setup_database.bat
   
   # On Linux/macOS
   cd backend/scripts
   chmod +x setup_database.sh
   ./setup_database.sh
   ```
   
   **Option B: Manual Setup**
   ```sql
   # Connect to MySQL as root
   mysql -u root -p
   
   # Run these commands:
   CREATE DATABASE asl_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'asl_user'@'localhost' IDENTIFIED BY 'asl_password_2024';
   GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
   
   **Option C: Use SQL Script**
   ```bash
   mysql -u root -p < database_setup.sql
   ```

4. **Configuration**
   
   The configuration is already set up in `config/config.yaml`:
   ```yaml
   database:
     host: "localhost"
     port: "3306"
     user: "asl_user"
     password: "asl_password_2024"
     name: "asl_market"
   ```
   
   **⚠️ Security Note:** Change the password in production!

5. **Run Server**
   ```bash
   go run main.go
   ```

Server will start on `http://localhost:8080`

## API Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "first_name": "احمد",
  "last_name": "محمدی",
  "email": "ahmad@example.com",
  "password": "password123",
  "phone": "09123456789"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ahmad@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "first_name": "احمد",
      "last_name": "محمدی",
      "email": "ahmad@example.com",
      "phone": "09123456789",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Public Routes (No Authentication Required)

#### Health Check
```http
GET /health
```

#### Dashboard Stats (Optional Auth)
```http
GET /api/v1/dashboard/stats
Authorization: Bearer YOUR_JWT_TOKEN (optional)
```

#### Products List
```http
GET /api/v1/products
```

#### Suppliers List
```http
GET /api/v1/suppliers
```

### Protected Routes (Authentication Required)

#### Get Current User
```http
GET /api/v1/me
Authorization: Bearer YOUR_JWT_TOKEN
```

#### User Dashboard
```http
GET /api/v1/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```

#### User Orders
```http
GET /api/v1/my-orders
Authorization: Bearer YOUR_JWT_TOKEN
```

#### User Products
```http
GET /api/v1/my-products
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Profile
```http
PUT /api/v1/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## Project Structure

```
backend/
├── main.go                 # Entry point
├── go.mod                  # Go module
├── config/
│   ├── config.go          # Configuration loader
│   └── config.yaml        # Configuration file
├── models/
│   ├── user.go            # User model and DTOs
│   └── database.go        # Database connection
├── controllers/
│   └── auth_controller.go # Authentication controller
├── middleware/
│   └── auth_middleware.go # JWT middleware
├── routes/
│   └── routes.go          # API routes
├── utils/
│   ├── jwt.go             # JWT utilities
│   └── password.go        # Password hashing utilities
└── README.md              # This file
```

## Authentication Flow

1. User registers or logs in
2. Server returns JWT token
3. Client stores token and sends it in Authorization header
4. Server validates token on protected routes
5. If valid, request proceeds; if invalid, returns 401

## Database Management

### Quick Start Commands

```bash
# Setup database (run once)
cd backend/scripts
./setup_database.sh  # Linux/macOS
# OR
setup_database.bat   # Windows

# Start backend server
cd backend
go run main.go
```

### Manual Database Commands

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database and user
CREATE DATABASE asl_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'asl_user'@'localhost' IDENTIFIED BY 'asl_password_2024';
GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'localhost';
FLUSH PRIVILEGES;

-- Test connection
mysql -u asl_user -p asl_market
```

### Reset Database (if needed)

```sql
-- Drop and recreate (WARNING: This deletes all data!)
DROP DATABASE IF EXISTS asl_market;
DROP USER IF EXISTS 'asl_user'@'localhost';

-- Then run setup again
```

## Environment Variables

You can override config.yaml values with environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=asl_user
export DB_PASSWORD=asl_password_2024
export DB_NAME=asl_market
export JWT_SECRET=your_secret_key
export SERVER_PORT=8080
```

## Development

```bash
# Run with hot reload (install air first)
go install github.com/cosmtrek/air@latest
air

# Run tests
go test ./...

# Build for production
go build -o asl-market-backend main.go
```

## Docker Support (Optional)

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/config ./config
CMD ["./main"]
```

## Production Considerations

1. Change JWT secret in production
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Use a production-ready database
5. Add rate limiting
6. Add logging and monitoring
7. Use a reverse proxy (nginx)

## API Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request 