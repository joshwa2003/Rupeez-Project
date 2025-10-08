# Money Tracker Backend API

A Node.js Express backend API for the Money Tracker application with MongoDB integration.

## Features

- **Authentication**: JWT-based authentication with login/register
- **User Management**: Profile and settings management
- **Transactions**: CRUD operations for financial transactions
- **Invoices**: Invoice management system
- **Dashboard**: Analytics and statistics endpoints
- **Billing**: Payment methods and billing information management
- **Security**: Helmet, rate limiting, CORS protection
- **Database**: MongoDB connection (ready for models)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env` file and update the values:
   ```bash
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/money-tracker
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

3. **MongoDB Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env` file
   - The application will connect to MongoDB but won't create models (as per requirements)

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

### Transactions
- `GET /api/transactions` - Get all transactions (with pagination & filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Invoices
- `GET /api/invoices` - Get all invoices (with pagination & filters)
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/stats/summary` - Get invoice statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts/sales` - Get sales chart data
- `GET /api/dashboard/charts/performance` - Get performance chart data
- `GET /api/dashboard/page-visits` - Get page visits data
- `GET /api/dashboard/social-traffic` - Get social traffic data
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/overview` - Get complete dashboard overview

### Billing
- `GET /api/billing/info` - Get billing information
- `POST /api/billing/info` - Add billing information
- `PUT /api/billing/info/:id` - Update billing information
- `DELETE /api/billing/info/:id` - Delete billing information
- `GET /api/billing/payment-methods` - Get payment methods
- `POST /api/billing/payment-methods` - Add payment method
- `DELETE /api/billing/payment-methods/:id` - Delete payment method
- `GET /api/billing/history` - Get payment history
- `GET /api/billing/summary` - Get billing summary

### Health Check
- `GET /api/health` - Health check endpoint

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials
For testing purposes, use these credentials:
- **Email**: demo@example.com
- **Password**: password123

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "status": "success",
  "message": "Optional success message",
  "data": {
    // Response data
  }
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Basic validation on all endpoints

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management routes
│   ├── transactions.js     # Transaction routes
│   ├── invoices.js         # Invoice routes
│   ├── dashboard.js        # Dashboard routes
│   └── billing.js          # Billing routes
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── server.js               # Main server file
└── README.md              # This file
```

### Adding New Routes
1. Create route file in `/routes` directory
2. Import and use in `server.js`
3. Add authentication middleware if needed
4. Follow existing patterns for consistency

## MongoDB Integration

The application is configured to connect to MongoDB but doesn't create any models as per requirements. To add models:

1. Create `/models` directory
2. Define Mongoose schemas
3. Import models in route files
4. Replace demo data with database operations

## Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test all endpoints

## License

MIT License
