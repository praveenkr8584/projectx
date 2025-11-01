import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddServiceForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/services', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    </div>
  );
};

export default AddServiceForm;
