import { useState, useEffect } from 'react';
import api from '../../api.js';

const RoomList = () => {
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="room-list">
      <h1>Available Rooms</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleFilterSubmit} className="filters horizontal-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Room Type:</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Min Price:</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min Price"
            />
          </div>
          <div className="filter-group">
            <label>Max Price:</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max Price"
            />
          </div>
          <div className="filter-group">
            <label>Check-in Date:</label>
            <input
              type="date"
              name="checkInDate"
              value={filters.checkInDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Check-out Date:</label>
            <input
              type="date"
              name="checkOutDate"
              value={filters.checkOutDate}
              onChange={handleFilterChange}
            />
          </div>
          <button type="submit" className="btn">Apply Filters</button>
        </div>
      </form>

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
              {room.status === 'available' ? (
                <button className="btn" onClick={() => window.location.href = `/booking?roomNumber=${room.roomNumber}`}>Book Now</button>
              ) : (
                <p>Status: {room.status}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
