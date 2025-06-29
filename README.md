# Better Tasks - Task Management & CRM Application

A modern, full-stack task management and CRM application built with React, TypeScript, Express.js, and MongoDB.

## 🏗️ Architecture Overview

This application follows a clean, modular architecture with clear separation of concerns:

```
better-tasks-app/
├── client/          # React + TypeScript frontend
├── server/          # Express + TypeScript backend
├── package.json     # Root package.json for running both apps
└── README.md
```

### Frontend (`/client`)
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side routing
- **Axios** for API communication
- **Context API** for state management
- **Lucide React** for beautiful icons

### Backend (`/server`)
- **Express.js** with TypeScript for robust API development
- **MongoDB** with Mongoose ODM for data persistence
- **JWT** authentication with role-based access control
- **bcryptjs** for secure password hashing
- **Express Validator** for input validation
- **CORS** enabled for cross-origin requests

## 🚀 Features

### User Management
- **Role-based authentication** (Admin, Manager, User)
- **JWT-based sessions** with automatic token refresh
- **Secure password hashing** with bcrypt
- **User profile management**

### Task Management
- **Create, read, update, delete tasks**
- **Priority levels** (Low, Medium, High, Urgent)
- **Status tracking** (To Do, In Progress, Completed)
- **Task assignment** to team members
- **Due date management** with overdue indicators
- **Task comments** and collaboration
- **Customer association** for client-related tasks

### Customer Relationship Management
- **Company profiles** with contact information
- **GST number validation** for Indian businesses
- **Multiple contacts** per company
- **Address management**
- **Customer notes** and history

### Call Logging
- **Inbound/outbound call tracking**
- **Call summaries** and outcomes
- **Duration tracking**
- **Follow-up scheduling**
- **Tag-based organization**
- **Customer call history**

### Dashboard & Analytics
- **Real-time statistics** and metrics
- **Task completion tracking**
- **Overdue task alerts**
- **Recent activity feed**
- **Quick action buttons**

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd better-tasks-app
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Server environment** (`/server/.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/better-tasks
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

   **Client environment** (`/client/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   
   **Local MongoDB:**
   ```bash
   mongod
   ```
   
   **Or use MongoDB Atlas** by updating the `MONGODB_URI` in your `.env` file

5. **Seed the database** (optional but recommended)
   ```bash
   cd server
   npm run seed
   ```

6. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

### Demo Credentials

After seeding the database, you can use these credentials to log in:

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **User**: user@example.com / user123

## 📁 Project Structure

### Client Structure
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main application layout
│   │   ├── TaskCard.tsx     # Task display component
│   │   └── LoadingSpinner.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Tasks.tsx        # Task management
│   │   ├── Customers.tsx    # Customer management
│   │   ├── Calls.tsx        # Call logging
│   │   └── Login.tsx        # Authentication
│   ├── services/            # API communication
│   │   └── api.ts           # Axios configuration and API calls
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles and Tailwind imports
├── public/                  # Static assets
├── package.json
└── vite.config.ts           # Vite configuration
```

### Server Structure
```
server/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.ts      # MongoDB connection setup
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   └── errorHandler.ts  # Error handling middleware
│   ├── models/              # Mongoose data models
│   │   ├── User.ts          # User model with roles
│   │   ├── Task.ts          # Task model with relationships
│   │   ├── Customer.ts      # Customer model with contacts
│   │   └── Call.ts          # Call logging model
│   ├── routes/              # Express route handlers
│   │   ├── auth.ts          # Authentication routes
│   │   ├── users.ts         # User management routes
│   │   ├── tasks.ts         # Task CRUD routes
│   │   ├── customers.ts     # Customer CRUD routes
│   │   └── calls.ts         # Call logging routes
│   ├── scripts/             # Utility scripts
│   │   └── seed.ts          # Database seeding script
│   └── server.ts            # Express server setup
├── package.json
└── tsconfig.json            # TypeScript configuration
```

## 🔐 Authentication & Authorization

The application implements a comprehensive role-based access control system:

### Roles
- **Admin**: Full access to all features and user management
- **Manager**: Access to all tasks, customers, and calls; can manage team members
- **User**: Limited to assigned tasks and own call logs

### Security Features
- **JWT tokens** with 7-day expiration
- **Password hashing** with bcrypt (12 rounds)
- **Protected routes** with middleware validation
- **Role-based permissions** on all endpoints
- **Input validation** with express-validator
- **CORS protection** for cross-origin requests

## 🗄️ Database Schema

### Collections

**Users**
- Authentication and profile information
- Role-based permissions (admin, manager, user)
- Account status management

**Tasks**
- Task details with priority and status
- User assignment and customer association
- Comment system for collaboration
- Due date tracking

**Customers**
- Company information and GST details
- Multiple contact management
- Address and notes storage
- Soft delete functionality

**Calls**
- Call logging with type and duration
- Customer and user associations
- Follow-up scheduling
- Tag-based organization

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Users (Admin/Manager only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Tasks
- `GET /api/tasks` - List tasks (filtered by role)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/comments` - Add comment
- `DELETE /api/tasks/:id` - Delete task

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Calls
- `GET /api/calls` - List calls (filtered by role)
- `GET /api/calls/:id` - Get call details
- `GET /api/calls/customer/:id` - Get calls by customer
- `POST /api/calls` - Log new call
- `PUT /api/calls/:id` - Update call
- `DELETE /api/calls/:id` - Delete call

## 🎨 Design System

The application uses a comprehensive design system built with Tailwind CSS:

### Color Palette
- **Primary**: Blue (#3B82F6) for main actions and navigation
- **Success**: Green (#10B981) for positive states
- **Warning**: Orange (#F59E0B) for attention states
- **Danger**: Red (#EF4444) for destructive actions
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Font weights 600-800 with proper hierarchy
- **Body**: Font weight 400 with 150% line height
- **Small text**: Font weight 500 for labels and metadata

### Components
- **Cards**: Consistent padding, shadows, and rounded corners
- **Buttons**: Multiple variants with hover states
- **Forms**: Consistent input styling with focus states
- **Navigation**: Clean sidebar with active states

## 🚀 Deployment

### Production Build

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Build the server**
   ```bash
   cd server
   npm run build
   ```

3. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

### Environment Setup

**Development:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: Local MongoDB or Atlas

**Production:**
- Use environment variables for all configuration
- Enable HTTPS for secure JWT transmission
- Use MongoDB Atlas for managed database
- Configure proper CORS origins
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation in the code comments

---

**Built with ❤️ using React, TypeScript, Express.js, and MongoDB**