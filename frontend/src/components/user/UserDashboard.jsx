import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(response.data);
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="user-dashboard">
      <h1>Welcome, {dashboardData?.user?.fullname}!</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Active Bookings</h3>
          <p>{dashboardData?.activeBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Bookings</h3>
          <p>{dashboardData?.upcomingBookings || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Spent</h3>
          <p>${dashboardData?.totalSpent || 0}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/user/bookings" className="btn">View My Bookings</Link>
        <Link to="/user/profile" className="btn">Edit Profile</Link>
        <Link to="/rooms" className="btn">Browse Rooms</Link>
        <Link to="/services" className="btn">View Services</Link>
        <Link to="/user/notifications" className="btn">Notifications</Link>
      </div>
    </div>
  );
};

export default UserDashboard;
