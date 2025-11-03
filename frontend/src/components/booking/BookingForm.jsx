import { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = () => {
  const url = 'https://projectx-backend-q4wb.onrender.com';
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    roomType: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomNumber = urlParams.get('roomNumber');
    if (roomNumber) {
      setFormData(prev => ({ ...prev, roomNumber }));
    }
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${url}/rooms`);
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      fetchAvailableRooms();
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  useEffect(() => {
    if (formData.roomType) {
      const filtered = rooms.filter(room => room.type === formData.roomType && room.status === 'Available');
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms([]);
    }
  }, [formData.roomType, rooms]);

  const fetchAvailableRooms = async () => {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate
      });
      const response = await axios.get(`${url}/rooms/available?${queryParams}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/booking`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Booking successful!');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Booking failed');
    }
  };
  return (
    <div className="booking-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          value={formData.customerName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="customerEmail"
          placeholder="Customer Email"
          value={formData.customerEmail}
          onChange={handleChange}
          required
        />
        <select name="roomType" value={formData.roomType} onChange={handleChange} required>
          <option value="">Select Room Type</option>
          <option value="Single Room">Single Room</option>
          <option value="Double Room">Double Room</option>
          <option value="Deluxe Room">Deluxe Room</option>
          <option value="Suite">Suite</option>
        </select>
        <select name="roomNumber" value={formData.roomNumber} onChange={handleChange} required>
          <option value="">Select Room</option>
          {filteredRooms.map(room => (
            <option key={room._id} value={room.roomNumber}>
              {room.roomNumber} - ${room.price}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="checkInDate"
          value={formData.checkInDate}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="checkOutDate"
          value={formData.checkOutDate}
          onChange={handleChange}
          required
        />
        <button type="submit">Book Room</button>
      </form>
      {message && <p>{message}</p>}

      {filteredRooms.length > 0 && (
        <div className="room-options">
          <h3>Available {formData.roomType}s</h3>
          <div className="rooms-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className="room-card">
                <h4>Room {room.roomNumber}</h4>
                <p><strong>Price:</strong> ${room.price} per night</p>
                <p><strong>Features:</strong> {room.features.join(', ')}</p>
                <p><strong>Status:</strong> {room.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
