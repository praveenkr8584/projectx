import { useState, useEffect } from 'react';
import api from '../../api.js';
import './UserRooms.css';

const UserRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    checkInDate: '',
    checkOutDate: ''
  });
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await api.get(`/rooms?${queryParams}`);
      setRooms(response.data);
    } catch (error) {
      setError('Failed to load rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleBookRoom = (roomNumber) => {
    if (isLoggedIn) {
      window.location.href = `/booking?roomNumber=${roomNumber}`;
    } else {
      window.location.href = '/login';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-rooms">

      {error && <div className="error">{error}</div>}

      <section className="filter-section">
        <form onSubmit={handleFilterSubmit} className="filters horizontal-filters">
          <div className="filter-row">
            <div className="filter-group">
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div className="filter-group">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min Price"
              />
            </div>
            <div className="filter-group">
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max Price"
              />
            </div>
            <div className="filter-group">
              <input
                type="date"
                name="checkInDate"
                value={filters.checkInDate}
                onChange={handleFilterChange}
                placeholder="Check-in Date"
              />
            </div>
            <div className="filter-group">
              <input
                type="date"
                name="checkOutDate"
                value={filters.checkOutDate}
                onChange={handleFilterChange}
                placeholder="Check-out Date"
              />
            </div>
            <button type="submit" className="btn">Apply Filters</button>
          </div>
        </form>
      </section>

      <section className="rooms-section">
        <h2>Available Rooms</h2>
        <div className="rooms-grid">
          {rooms.length === 0 ? (
            <p>No rooms available matching your criteria.</p>
          ) : (
            rooms.map(room => (
              <div key={room._id} className="room-card">
                <h3>Room {room.roomNumber}</h3>
                <p>Type: {room.type}</p>
                <p>Price: ${room.price} per night</p>
                <p>Features: {room.features.join(', ')}</p>
                {isLoggedIn ? (
                  room.status === 'available' ? (
                    <button className="btn" onClick={() => handleBookRoom(room.roomNumber)}>Book Now</button>
                  ) : (
                    <p>Status: {room.status}</p>
                  )
                ) : (
                  <button className="btn" onClick={() => handleBookRoom(room.roomNumber)}>Login to Book</button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default UserRooms;
