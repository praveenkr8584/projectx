# Hotel Management System

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for managing hotel operations, including room bookings, service management, user authentication, and an admin dashboard.

## Features

### User Features
- User registration and login with JWT authentication
- Browse available rooms with filtering options (type, price, dates)
- Book rooms with automatic email confirmations
- View and manage personal bookings
- Access hotel services
- User dashboard and profile management
- Real-time notifications

### Admin Features
- Comprehensive admin dashboard with analytics
- Manage rooms (add, edit, delete, view availability)
- Manage services (add, edit, delete)
- View and manage all bookings
- User management (view, manage user accounts)
- Audit logging for system activities
- Email notifications for new bookings

### General Features
- Responsive design for mobile and desktop
- Secure file uploads for images/documents
- Email integration for confirmations and alerts
- Data validation and error handling
- Role-based access control (Admin/User)

## Tech Stack

### Backend
- **Node.js** with **Express.js** for server-side logic
- **MongoDB** with **Mongoose** for database management
- **JWT** for authentication
- **bcryptjs** for password hashing
- **multer** for file uploads
- **nodemailer** for email services
- **Joi** for data validation
- **cors** for cross-origin requests

### Frontend
- **React 19** with **Vite** for fast development
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Formik** and **Yup** for form handling and validation
- **Chart.js** for data visualization
- **Framer Motion** for animations
- **Styled Components** for styling
- **React Icons** for iconography

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup
1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the Backend directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/hotel_management
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ADMIN_EMAIL=admin@hotel.com
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npx nodemon app.js
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (default Vite port)

## Usage

1. **User Registration/Login**: Users can register and log in to access booking features.
2. **Browse Rooms**: View available rooms with filters for type, price, and dates.
3. **Make Bookings**: Authenticated users can book rooms, receiving email confirmations.
4. **Admin Dashboard**: Admins can manage rooms, services, bookings, and users through the dashboard.
5. **Services**: Users can view and request hotel services.

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

### Public Routes
- `GET /rooms` - Get rooms with filters
- `GET /rooms/available` - Get available rooms
- `GET /services` - Get all services
- `POST /booking` - Create a booking (authenticated)
- `POST /services` - Create a service request (authenticated)

### Admin Routes (Protected)
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/rooms` - Get all rooms
- `POST /admin/rooms` - Add new room
- `PUT /admin/rooms/:id` - Update room
- `DELETE /admin/rooms/:id` - Delete room
- `GET /admin/services` - Get all services
- `POST /admin/services` - Add new service
- `PUT /admin/services/:id` - Update service
- `DELETE /admin/services/:id` - Delete service
- `GET /admin/bookings` - Get all bookings
- `PUT /admin/bookings/:id` - Update booking status
- `GET /admin/users` - Get all users

### User Routes (Protected)
- `GET /user/dashboard` - User dashboard
- `GET /user/bookings` - Get user's bookings
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile

## Project Structure

```
projectx/
├── Backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── auditLog.js
│   │   ├── booking.js
│   │   ├── room.js
│   │   ├── service.js
│   │   └── user.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── public.js
│   │   └── user.js
│   ├── utils/
│   │   ├── audit.js
│   │   └── email.js
│   ├── validators/
│   │   └── schemas.js
│   ├── uploads/
│   ├── app.js
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── common/
│   │   │   ├── home/
│   │   │   ├── rooms/
│   │   │   ├── services/
│   │   │   └── user/
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── .gitignore
├── .gitignore
└── README.md
```




