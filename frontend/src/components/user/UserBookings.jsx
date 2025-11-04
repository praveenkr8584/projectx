import { useState, useEffect } from 'react';
import api from '../../api.js';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get(`/user/bookings`);
      setBookings(response.data);
    } catch (error) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    try {
      await api.put(`/user/bookings/${bookingId}/cancel`);
      fetchBookings(); // Refresh bookings list
      alert('Booking cancelled successfully!');
    } catch (error) {
      setError('Failed to cancel booking');
      console.error('Error cancelling booking:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'checked-in': return 'status-checked-in';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;

    // Check if cancellation is within 24 hours of check-in
    const checkInTime = new Date(booking.checkInDate).getTime();
    const now = new Date().getTime();
    const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);

    return hoursUntilCheckIn > 24;
  };

  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const checkInDate = new Date(booking.checkInDate);

    switch (filter) {
      case 'upcoming':
        return checkInDate >= now && booking.status !== 'cancelled';
      case 'past':
        return checkInDate < now || booking.status === 'completed' || booking.status === 'cancelled';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  }).sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate));

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
    <div className="user-bookings">
      <h1>My Bookings</h1>

      {error && <div className="error">{error}</div>}

      <div className="bookings-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bookings
        </button>
        <button
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found for the selected filter.</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>Booking Reference: {booking.bookingReference}</h3>
                <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span><strong>Room:</strong> {booking.roomNumber}</span>
                  <span><strong>Total:</strong> ${booking.totalAmount}</span>
                </div>

                <div className="detail-row">
                  <span><strong>Check-in:</strong> {new Date(booking.checkInDate).toLocaleDateString()}</span>
                  <span><strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}

                {booking.cancelledAt && (
                  <div className="cancellation-info">
                    <strong>Cancelled on:</strong> {new Date(booking.cancelledAt).toLocaleDateString()}
                    {booking.cancellationReason && (
                      <span> - {booking.cancellationReason}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="booking-actions">
                {canCancelBooking(booking) && (
                  <button
                    className="btn cancel-btn"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserBookings;
