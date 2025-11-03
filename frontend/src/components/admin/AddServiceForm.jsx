import { useState } from 'react';
import api from '../../api';

const AddServiceForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [message, setMessage] = useState('');

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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Add New Service</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          name="name"
          placeholder="Service Name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', resize: 'vertical', minHeight: '100px' }}
        />
        <button
          type="submit"
          style={{
            padding: '12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          Add Service
        </button>
      </form>
      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          borderRadius: '5px',
          fontWeight: 'bold',
          backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
          color: message.includes('successfully') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddServiceForm;
