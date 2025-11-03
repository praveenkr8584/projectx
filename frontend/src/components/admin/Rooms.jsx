import { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';
import './Rooms.css';

const Rooms = () => {
  const [showAddSection, setShowAddSection] = useState(false);
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
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    text: '',
    status: ''
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'features') {
      setFormData({ ...formData, [name]: value.split(',').map(f => f.trim()) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'features') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });
      images.forEach(image => data.append('images', image));
      const token = localStorage.getItem('token');
      await api.post('/admin/dashboard/rooms', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Room added successfully!');
      setFormData({
        roomNumber: '',
        type: '',
        price: '',
        status: 'available',
        features: [],
      });
      setImages([]);
      setPreviews([]);
      fetchRooms();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add room';
      if (errorMessage === 'Invalid token') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return;
      }
      setMessage(errorMessage);
    }
  };

  // Admin utility handlers
  const isAdmin = localStorage.getItem('role') === 'admin';
  const handleExport = (format) => {
    const dataToExport = selectedItems.length > 0 ? rooms.filter(r => selectedItems.includes(r._id)) : filteredRooms;
    if (format === 'csv') {
      const header = 'roomNumber,type,price,status,features\n';
      const rows = dataToExport.map(r => `${r.roomNumber},${r.type},${r.price},${r.status},"${r.features?.join('; ') || ''}"`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rooms.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rooms.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => alert('Imported file content: ' + e.target.result);
    reader.readAsText(file);
  };

  useEffect(() => {
    if (isAdmin) fetchRooms();
  }, [isAdmin]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/admin/dashboard', { headers });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/dashboard/rooms/${id}`, {
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
      await Promise.all(selectedItems.map(id => api.delete(`/admin/dashboard/rooms/${id}`, { headers })));
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

  return (
    <div className="rooms-container">
      {/* Section 1: Fixed Filter Panel */}
      <section className="rooms-filter-section">
        <FilterPanel
          fields={[
            { name: 'text', label: 'Search', placeholder: 'Filter by room number...' },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: '', label: 'All statuses' },
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' }
            ] }
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => {}}
          onReset={() => setFilters({ text: '', status: '' })}
          className="admin-filters"
        />
      </section>

      {/* Section 2: Add Room Section */}
      <section className="rooms-add-section">
        <button className="toggle-button" onClick={() => setShowAddSection(!showAddSection)}>
          {showAddSection ? 'Hide Add Room Section' : 'Add New Room'}
        </button>
        {showAddSection && (
          <div className="add-room-content">
            {/* Upload Section */}
            <div className="rooms-upload-section">
              <h4>Upload Rooms</h4>
              <label htmlFor="room-upload">
                Upload room information using CSV or JSON file
              </label>
              <input
                id="room-upload"
                type="file"
                accept=".csv,.json"
                onChange={e => handleImport(e.target.files[0])}
              />
            </div>

            {/* Add Room Form */}
            <div className="rooms-form-section">
              <h4>Manual Addition</h4>
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Room Images (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    style={{ display: 'block', marginBottom: 8 }}
                  />
                  {previews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {previews.map((preview, index) => (
                        <img key={index} src={preview} alt={`Preview ${index + 1}`} style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover' }} />
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
                  placeholder="Room Type"
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
              {message && (
                <div className={`rooms-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Rooms List Section */}
      <section className="rooms-list-section">
        <h3>Current Rooms</h3>

        <div className="rooms-actions">
          <button onClick={() => handleExport('csv')}>Export CSV</button>
          <button onClick={() => handleExport('json')}>Export JSON</button>
          <input
            type="file"
            accept=".csv,.json"
            onChange={e => handleImport(e.target.files[0])}
          />
          <button onClick={handleBulkDelete} disabled={selectedItems.length === 0}>Delete Selected</button>
          <button onClick={fetchRooms}>Refresh</button>
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
      </section>
    </div>
  );
};

export default Rooms;
