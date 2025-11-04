import { useState, useEffect } from 'react';
import api from '../../api';

const BookingForm = ({ onSubmitSuccess, initialMessage = '', onMessageChange }) => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    roomType: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
    totalAmount: 0
  });
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomNumber = urlParams.get('roomNumber');
    if (roomNumber) {
      // Fetch the specific room details to pre-fill roomType and roomNumber
      const fetchRoomDetails = async () => {
        try {
          const response = await api.get('/rooms');
          const room = response.data.find(r => r.roomNumber === roomNumber);
          if (room) {
            setFormData(prev => ({ ...prev, roomType: room.type, roomNumber: room.roomNumber }));
            setFilteredRooms([room]); // Set filteredRooms to include only this room
          }
        } catch (error) {
          console.error('Error fetching room details:', error);
        }
      };
      fetchRoomDetails();
    }
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms');
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
    if (formData.roomType && !formData.roomNumber) {
      const filtered = rooms.filter(room => room.type.toLowerCase() === formData.roomType.toLowerCase() && room.status === 'available');
      setFilteredRooms(filtered);
    } else if (formData.roomNumber) {
      // If roomNumber is pre-filled, keep only that room in filteredRooms
      const room = rooms.find(r => r.roomNumber === formData.roomNumber);
      setFilteredRooms(room ? [room] : []);
    } else {
      setFilteredRooms([]);
    }
  }, [formData.roomType, formData.roomNumber, rooms]);

  const fetchAvailableRooms = async () => {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate
      });
      const response = await api.get(`/rooms?${queryParams}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Calculate total amount when roomNumber or dates change
    if (name === 'roomNumber' || name === 'checkInDate' || name === 'checkOutDate') {
      const room = rooms.find(r => r.roomNumber == value) || filteredRooms.find(r => r.roomNumber == value);
      if (room && formData.checkInDate && formData.checkOutDate) {
        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total = nights * room.price;
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/booking', formData);
      const successMessage = 'Booking successful!';
      setMessage(successMessage);
      if (onMessageChange) onMessageChange(successMessage);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Booking failed';
      setMessage(errorMessage);
      if (onMessageChange) onMessageChange(errorMessage);
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
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Deluxe">Deluxe</option>
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
          <h3>Available {formData.roomType || 'Rooms'}</h3>
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
