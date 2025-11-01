import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';

const AddRoomForm = () => {
  const url='https://projectx-backend-q4wb.onrender.com';
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: '',
    price: '',
    status: 'available',
    features: [],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    text: '',
    status: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${url}/admin/dashboard`, { headers });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${url}/admin/dashboard/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleEdit = (item) => {
    navigate('/admin/dashboard', { state: { editing: { ...item, type: 'rooms' } } });
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allIds = filteredRooms.map(room => room._id);
    setSelectedItems(prev => prev.length === allIds.length ? [] : allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(selectedItems.map(id => axios.delete(`${url}/admin/dashboard/rooms/${id}`, { headers })));
      setSelectedItems([]);
      fetchRooms();
    } catch (error) {
      console.error('Error bulk deleting rooms:', error);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.roomNumber.toLowerCase().includes(filters.text.toLowerCase()) &&
    (filters.status === '' || room.status === filters.status)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'features') {
      setFormData({ ...formData, features: value.split(', ') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'features') {
          data.append(key, value.join(', '));
        } else {
          data.append(key, value);
        }
      });
      images.forEach((img) => data.append('images', img));
      await axios.post(`${url}/admin/dashboard/rooms`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Room added successfully!');
      setImages([]);
      setPreviews([]);
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to add room');
    }
  };

    // Admin utility handlers
    const isAdmin = localStorage.getItem('role') === 'admin';
    const handleExport = (format) => {
      const content = format === 'csv' ? 'roomNumber,type,price,status,features\n' : JSON.stringify(formData, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const handleImport = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => alert('Imported file content: ' + e.target.result);
      reader.readAsText(file);
    };
  return (
    <div>
      <button className="add-new-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Hide Add Room Form' : 'Add New Room'}
      </button>

      {showForm && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {isAdmin && (
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
              <label htmlFor="room-upload" style={{
                fontWeight: 500,
                marginBottom: '0.5rem',
                fontSize: '1rem',
                color: '#333'
              }}>
                upload room information using csv or json file
              </label>
              <input
                id="room-upload"
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
          )}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Room Images (optional, multiple)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                style={{ display: 'block', marginBottom: 8 }}
              />
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {previews.map((src, idx) => (
                    <img key={idx} src={src} alt={`Preview ${idx + 1}`} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              name="roomNumber"
              placeholder="Room Number"
              value={formData.roomNumber}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="type"
              placeholder="Type"
              value={formData.type}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <input
              type="text"
              name="features"
              placeholder="Features (comma separated)"
              value={formData.features.join(', ')}
              onChange={handleChange}
            />
            <button type="submit">Add Room</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      )}

      <h3>Rooms</h3>
      {selectedItems.length > 0 && <button onClick={handleBulkDelete} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>Delete Selected ({selectedItems.length})</button>}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => handleExport('rooms', 'csv')} className="export-btn">Export CSV</button>
        <button onClick={() => handleExport('rooms', 'json')} className="export-btn">Export JSON</button>
        <input type="file" accept=".csv,.json" onChange={(e) => handleImport('rooms', e.target.files[0])} className="import-input" />
        <FilterPanel
          fields={[
            { name: 'text', label: 'Room', placeholder: 'Filter by room number...' },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: '', label: 'All Statuses' },
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' }
            ] }
          ]}
          values={filters}
          onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          onApply={() => {}}
          onReset={() => setFilters({ text: '', status: '' })}
          className="admin-filters"
        />
      </div>
      <DataTable
        data={filteredRooms}
        type="rooms"
        onEdit={handleEdit}
        onDelete={handleDelete}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
};

export default AddRoomForm;
