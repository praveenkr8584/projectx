import { useState, useEffect } from 'react';
import api from '../../api.js';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import EditForm from './EditForm';
import BookingForm from '../common/BookingForm';
import './Bookings.css';

const Bookings = () => {
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
      const response = await api.get(`/rooms`);
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get(`/admin/dashboard`);
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
      const filtered = rooms.filter(room => room.type.toLowerCase() === formData.roomType.toLowerCase() && room.status === 'available');
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
      const response = await api.get(`/rooms?${queryParams}`);
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
      const response = await api.post(`/user/booking`, formData);
      setMessage('Booking successful!');
      fetchBookings();
      setFormData({
        customerName: '',
        customerEmail: '',
        roomType: '',
        roomNumber: '',
        checkInDate: '',
        checkOutDate: ''
      });
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
      await Promise.all(selectedItems.map(id => api.delete(`/admin/dashboard/bookings/${id}`)));
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
      await api.post(`/admin/dashboard/bookings/import`, formDataImport);
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

  return (
    <div className="bookings-container">
      {editing && (
        <EditForm
          item={editing}
          type={editing.type}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Section 1: Fixed Filter Panel */}
      <section className="bookings-filter-section">
        <FilterPanel
          fields={[
            { name: 'text', label: 'Search', placeholder: 'Filter by customer name...' },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: '', label: 'All statuses' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' }
            ] },
            { name: 'checkInStart', label: 'Check-in Start', type: 'date' },
            { name: 'checkInEnd', label: 'Check-in End', type: 'date' }
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => {}}
          onReset={() => setFilters({ text: '', status: '', checkInStart: '', checkInEnd: '' })}
          className="admin-filters"
        />
      </section>

      {/* Section 2: Add Booking Section */}
      <section className="bookings-add-section">
        <button className="toggle-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide Add Booking Section' : 'Add New Booking'}
        </button>
        {showForm && (
          <div className="add-booking-content">
            {/* Upload Section */}
            <div className="bookings-upload-section">
              <h4>Upload Bookings</h4>
              <label htmlFor="booking-upload">
                Upload booking information using CSV or JSON file
              </label>
              <input
                id="booking-upload"
                type="file"
                accept=".csv,.json"
                onChange={e => handleImportBookings(e.target.files[0])}
              />
            </div>

            {/* Booking Form */}
            <div className="bookings-form-section">
              <h4>Manual Booking</h4>
              <BookingForm
                onSubmitSuccess={() => {
                  fetchBookings();
                  setFormData({
                    customerName: '',
                    customerEmail: '',
                    roomType: '',
                    roomNumber: '',
                    checkInDate: '',
                    checkOutDate: ''
                  });
                }}
                onMessageChange={setMessage}
                initialMessage={message}
              />
              {message && (
                <div className={`bookings-message ${message.includes('successful') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Bookings List Section */}
      <section className="bookings-list-section">
        <h3>Current Bookings</h3>

        <div className="bookings-actions">
          <button onClick={() => handleExportBookings('csv')}>Export CSV</button>
          <button onClick={() => handleExportBookings('json')}>Export JSON</button>
          <input
            type="file"
            accept=".csv,.json"
            onChange={e => handleImportBookings(e.target.files[0])}
          />
          <button onClick={handleBulkDelete} disabled={selectedItems.length === 0}>Delete Selected</button>
          <button onClick={fetchBookings}>Refresh</button>
        </div>

        <DataTable
          data={filteredBookings}
          type="bookings"
          onEdit={handleEdit}
          onDelete={(id) => {
            const token = localStorage.getItem('token');
            api.delete(`/admin/dashboard/bookings/${id}`).then(() => fetchBookings());
          }}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
        />
      </section>
    </div>
  );
};

export default Bookings;
