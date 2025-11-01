import { useState, useEffect } from 'react';
import axios from 'axios';

const EditForm = ({ item, type, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || {});

  useEffect(() => {
    setFormData(item || {});
  }, [item]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/admin/dashboard/${type}/${formData._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSave();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const renderFields = () => {
    switch (type) {
      case 'rooms':
        return (
          <>
            <input name="roomNumber" value={formData.roomNumber || ''} onChange={handleChange} placeholder="Room Number" required />
            <input name="type" value={formData.type || ''} onChange={handleChange} placeholder="Type" required />
            <input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="Price" required />
            <select name="status" value={formData.status || ''} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <input name="features" value={formData.features?.join(', ') || ''} onChange={(e) => setFormData({...formData, features: e.target.value.split(', ')})} placeholder="Features (comma separated)" />
          </>
        );
      case 'bookings':
        return (
          <>
            <input name="customerName" value={formData.customerName || ''} onChange={handleChange} placeholder="Customer Name" required />
            <input name="customerEmail" value={formData.customerEmail || ''} onChange={handleChange} placeholder="Customer Email" required />
            <input name="roomNumber" value={formData.roomNumber || ''} onChange={handleChange} placeholder="Room Number" required />
            <input name="checkInDate" type="date" value={formData.checkInDate ? new Date(formData.checkInDate).toISOString().split('T')[0] : ''} onChange={handleChange} required />
            <input name="checkOutDate" type="date" value={formData.checkOutDate ? new Date(formData.checkOutDate).toISOString().split('T')[0] : ''} onChange={handleChange} required />
            <select name="status" value={formData.status || ''} onChange={handleChange}>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input name="totalAmount" type="number" value={formData.totalAmount || ''} onChange={handleChange} placeholder="Total Amount" required />
          </>
        );
      case 'services':
        return (
          <>
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Service Name" required />
            <input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="Price" required />
            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Description" required />
          </>
        );
      case 'users':
        return (
          <>
            <input name="username" value={formData.username || ''} onChange={handleChange} placeholder="Username" required />
            <input name="fullname" value={formData.fullname || ''} onChange={handleChange} placeholder="Full Name" required />
            <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" required />
            <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone" required />
            <select name="role" value={formData.role || ''} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="edit-form">
      <h3>Edit {type.slice(0, -1)}</h3>
      <form onSubmit={handleSubmit}>
        {renderFields()}
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default EditForm;
