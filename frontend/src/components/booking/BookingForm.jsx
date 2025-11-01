import { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../common/DataTable';
import EditForm from '../admin/EditForm';
import { useNavigate } from 'react-router-dom';

const BookingForm = () => {
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
  const [showForm, setShowForm] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    text: '',
    status: '',
    checkInStart: '',
    checkInEnd: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

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
        const response = await axios.get('http://localhost:3000/rooms');
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();

    if (isAdmin) {
      fetchBookings();
    }
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:3000/admin/dashboard', { headers });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

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
      const response = await axios.get(`http://localhost:3000/rooms/available?${queryParams}`);
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
      const response = await axios.post('http://localhost:3000/booking', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Booking successful!');
      if (isAdmin) {
        fetchBookings();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Booking failed');
    }
  };

  const handleEdit = (item, type) => {
    setEditing({ ...item, type });
  };

  const handleSave = () => {
    setEditing(null);
    fetchBookings();
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allIds = filteredBookings.map(booking => booking._id);
    setSelectedItems(prev => prev.length === allIds.length ? [] : allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(selectedItems.map(id => axios.delete(`http://localhost:3000/admin/dashboard/bookings/${id}`, { headers })));
      setSelectedItems([]);
      fetchBookings();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleExportBookings = (format) => {
    const data = filteredBookings;
    let content = '';
    let filename = `bookings.${format}`;
    let mimeType = '';

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      content = [headers, ...rows].join('\n');
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBookings = async (file) => {
    if (!file) return;
    const formDataImport = new FormData();
    formDataImport.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:3000/admin/dashboard/bookings/import', formDataImport, { headers });
      fetchBookings();
      alert('Import successful');
    } catch (error) {
      console.error('Error importing:', error);
      alert('Import failed');
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(filters.text.toLowerCase()) &&
    (filters.status === '' || booking.status === filters.status) &&
    (!filters.checkInStart || new Date(booking.checkInDate) >= new Date(filters.checkInStart)) &&
    (!filters.checkInEnd || new Date(booking.checkInDate) <= new Date(filters.checkInEnd))
  );

    // Admin utility handlers
    const isAdmin = localStorage.getItem('role') === 'admin';
    const handleExport = (format) => {
      const content = format === 'csv' ? 'roomNumber,roomType,checkInDate,checkOutDate\n' : JSON.stringify(formData, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const handleImport = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => alert('Imported file content: ' + e.target.result);
      reader.readAsText(file);
    };
  return (
    <div className="booking-form">
      {editing && (
        <EditForm
          item={editing}
          type={editing.type}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {isAdmin && (
        <>
          <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            Make New Booking
          </button>

          {showForm && (
            <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }}>
              <div style={{
                maxWidth: '400px',
                margin: '0 auto 1rem auto',
                padding: '1rem 2rem',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
                <label htmlFor="booking-upload" style={{
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  color: '#333'
                }}>
                  upload booking information using csv or json file
                </label>
                <input
                  id="booking-upload"
                  type="file"
                  accept=".csv,.json"
                  onChange={e => handleImport(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    background: '#fafafa',
                    marginBottom: 0
                  }}
                />
              </div>
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
          )}

          <h3>Bookings</h3>
          {selectedItems.length > 0 && <button onClick={handleBulkDelete} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>Delete Selected ({selectedItems.length})</button>}
          <div style={{ marginBottom: '10px' }}>
            <button onClick={() => handleExportBookings('csv')} className="export-btn">Export CSV</button>
            <button onClick={() => handleExportBookings('json')} className="export-btn">Export JSON</button>
            <input type="file" accept=".csv,.json" onChange={(e) => handleImportBookings(e.target.files[0])} className="import-input" />
            <input
              type="text"
              placeholder="Filter by customer name..."
              value={filters.text}
              onChange={(e) => handleFilterChange('text', e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ marginRight: '10px', padding: '5px' }}>
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              placeholder="Check-in Start"
              value={filters.checkInStart}
              onChange={(e) => handleFilterChange('checkInStart', e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="date"
              placeholder="Check-in End"
              value={filters.checkInEnd}
              onChange={(e) => handleFilterChange('checkInEnd', e.target.value)}
              style={{ padding: '5px' }}
            />
          </div>
          <DataTable
            data={filteredBookings}
            type="bookings"
            onEdit={handleEdit}
            onDelete={(id) => {
              const token = localStorage.getItem('token');
              axios.delete(`http://localhost:3000/admin/dashboard/bookings/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(() => fetchBookings());
            }}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
          />
        </>
      )}

      {!isAdmin && (
        <>
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
        </>
      )}
    </div>
  );
};

export default BookingForm;
