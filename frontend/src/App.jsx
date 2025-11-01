import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BookingForm from './components/booking/BookingForm';
import AdminDashboard from './components/admin/AdminDashboard';
import Profile from './components/admin/AdminProfile';
import Home from './components/home/Home';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import AddRoomForm from './components/admin/AddRoomForm';
import AddServiceForm from './components/admin/AddServiceForm';
import UserDashboard from './components/user/UserDashboard';
import UserProfile from './components/user/UserProfile';
import UserBookings from './components/user/UserBookings';
import RoomList from './components/rooms/RoomList';
import ServiceList from './components/services/ServiceList';
import UserNotifications from './components/user/UserNotifications';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  useEffect(() => {
    const handleLogin = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role');
      setIsLoggedIn(!!token);
      setRole(userRole);
    };

    // Listen for login event
    window.addEventListener('login', handleLogin);

    // Initial check
    handleLogin();

    return () => window.removeEventListener('login', handleLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setRole('');
  };

  return (
    <Router>
      <div>
        <Navbar isLoggedIn={isLoggedIn} role={role} handleLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/booking" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/add-room" element={<ProtectedRoute><AddRoomForm /></ProtectedRoute>} />
          <Route path="/admin/add-service" element={<ProtectedRoute><AddServiceForm /></ProtectedRoute>} />
          <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/user/bookings" element={<ProtectedRoute><UserBookings /></ProtectedRoute>} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/booking" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/user/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
