import { useState, useEffect } from 'react';
import api from '../../api.js';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(`/user/notifications`);
        setNotifications(response.data);
      } catch (error) {
        setError('Failed to load notifications');
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-notifications">
      <h1>My Notifications</h1>

      {error && <div className="error">{error}</div>}

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className="notification-card">
              <p>{notification.message}</p>
              <small>{new Date(notification.date).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
