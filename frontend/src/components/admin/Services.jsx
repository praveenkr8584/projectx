import { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';
import './Services.css';

const Services = () => {
  const [showAddSection, setShowAddSection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [message, setMessage] = useState('');
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ text: '', priceMin: '', priceMax: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', formData);
      setMessage('Service added successfully!');
      setFormData({
        name: '',
        price: '',
        description: ''
      });
      fetchServices();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add service';
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
    const dataToExport = selectedItems.length > 0 ? services.filter(s => selectedItems.includes(s._id)) : filteredServices;
    if (format === 'csv') {
      const header = 'name,price,description\n';
      const rows = dataToExport.map(s => `${s.name},${s.price},"${s.description || ''}"`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `services.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `services.json`;
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
    if (isAdmin) fetchServices();
  }, [isAdmin]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setServices(res.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/dashboard/services/${id}`);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleEdit = (item) => {
    navigate('/admin/dashboard', { state: { editing: { ...item, type: 'services' } } });
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allIds = filteredServices.map(s => s._id);
    setSelectedItems(prev => prev.length === allIds.length ? [] : allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/dashboard/services/${id}`)));
      setSelectedItems([]);
      fetchServices();
    } catch (error) {
      console.error('Error bulk deleting services:', error);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(filters.text.toLowerCase()) &&
    (!filters.priceMin || service.price >= parseFloat(filters.priceMin)) &&
    (!filters.priceMax || service.price <= parseFloat(filters.priceMax))
  );

  return (
    <div className="services-container">
      {/* Section 1: Fixed Filter Panel */}
      <section className="services-filter-section">
        <FilterPanel
          fields={[
            { name: 'text', label: 'Search', placeholder: 'Filter by service name...' },
            { name: 'priceMin', label: 'Min Price', type: 'number', placeholder: 'Min price' },
            { name: 'priceMax', label: 'Max Price', type: 'number', placeholder: 'Max price' }
          ]}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onApply={() => {}}
          onReset={() => setFilters({ text: '', priceMin: '', priceMax: '' })}
          className="admin-filters"
        />
      </section>

      {/* Section 2: Add Service Section */}
      <section className="services-add-section">
        <button className="toggle-button" onClick={() => setShowAddSection(!showAddSection)}>
          {showAddSection ? 'Hide Add Service Section' : 'Add New Service'}
        </button>
        {showAddSection && (
          <div className="add-service-content">
            {/* Upload Section */}
            <div className="services-upload-section">
              <h4>Upload Services</h4>
              <label htmlFor="service-upload">
                Upload service information using CSV or JSON file
              </label>
              <input
                id="service-upload"
                type="file"
                accept=".csv,.json"
                onChange={e => handleImport(e.target.files[0])}
              />
            </div>

            {/* Add Service Form */}
            <div className="services-form-section">
              <h4>Manual Addition</h4>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Service Name"
                  value={formData.name}
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
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <button type="submit">Add Service</button>
              </form>
              {message && (
                <div className={`services-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Services List Section */}
      <section className="services-list-section">
        <h3>Current Services</h3>

        <div className="services-actions">
          <button onClick={() => handleExport('csv')}>Export CSV</button>
          <button onClick={() => handleExport('json')}>Export JSON</button>
          <input
            type="file"
            accept=".csv,.json"
            onChange={e => handleImport(e.target.files[0])}
          />
          <button onClick={handleBulkDelete} disabled={selectedItems.length === 0}>Delete Selected</button>
          <button onClick={fetchServices}>Refresh</button>
        </div>

        <DataTable
          data={filteredServices}
          type="services"
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

export default Services;
