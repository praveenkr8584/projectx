import { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';

const AddServiceForm = () => {
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

  useEffect(() => {
    if (localStorage.getItem('role') === 'admin') fetchServices();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', formData);
      setMessage('Service added successfully!');
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to add service');
    }
  };

    // Admin utility handlers
    const isAdmin = localStorage.getItem('role') === 'admin';
    const handleExport = (format) => {
      const content = format === 'csv' ? 'name,price,description\n' : JSON.stringify(formData, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service.${format}`;
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
            <label htmlFor="service-upload" style={{
              fontWeight: 500,
              marginBottom: '0.5rem',
              fontSize: '1rem',
              color: '#333'
            }}>
              upload service information using csv or json file
            </label>
            <input
              id="service-upload"
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
      {message && <p>{message}</p>}
      <h3>Services</h3>
      {selectedItems.length > 0 && <button onClick={handleBulkDelete} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>Delete Selected ({selectedItems.length})</button>}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => handleExport('services', 'csv')} className="export-btn">Export CSV</button>
        <button onClick={() => handleExport('services', 'json')} className="export-btn">Export JSON</button>
        <input type="file" accept=".csv,.json" onChange={(e) => handleImport(e.target.files[0])} className="import-input" />
        <FilterPanel
          fields={[
            { name: 'text', label: 'Service', placeholder: 'Filter by service name...' },
            { name: 'priceMin', label: 'Min Price', type: 'number' },
            { name: 'priceMax', label: 'Max Price', type: 'number' }
          ]}
          values={filters}
          onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          onApply={() => {}}
          onReset={() => setFilters({ text: '', priceMin: '', priceMax: '' })}
          className="admin-filters"
        />
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
    </div>
  );
};

export default AddServiceForm;
