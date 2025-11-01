import { useState, useEffect } from 'react';
import axios from 'axios';

const UserBookings = () => {
  const url='https://projectx-backend-q4wb.onrender.com';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/user/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${url}/user/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings(); // Refresh bookings list
      alert('Booking cancelled successfully!');
    } catch (error) {
      setError('Failed to cancel booking');
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-bookings">
      <h1>My Bookings</h1>

      {error && <div className="error">{error}</div>}

      <div className="bookings-list">
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <h3>Room {booking.roomNumber}</h3>
              <p>Check-in: {new Date(booking.checkInDate).toLocaleDateString()}</p>
              <p>Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}</p>
              <p>Status: {booking.status}</p>
              <p>Total: ${booking.totalAmount}</p>
              {booking.status === 'confirmed' && (
                <button
                  className="btn cancel-btn"
                  onClick={() => handleCancelBooking(booking._id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserBookings;
