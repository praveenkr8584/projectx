import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    phone: '',
    aadharno: '',
    role: 'customer',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ text: '', role: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (image) data.append('image', image);
      const response = await api.post('/register', data);
      setMessage('User registered successfully!');
      setFormData({
        username: '',
        fullname: '',
        email: '',
        password: '',
        phone: '',
        aadharno: '',
        role: 'customer',
      });
      setImage(null);
      setPreview(null);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      if (errorMessage === 'Invalid token') {
        // Token is invalid, redirect to login
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
      const dataToExport = selectedItems.length > 0 ? users.filter(u => selectedItems.includes(u._id)) : filteredUsers;
      if (format === 'csv') {
        const header = 'username,fullname,email,phone,aadharno,role\n';
        const rows = dataToExport.map(u => `${u.username},${u.fullname},${u.email},${u.phone},${u.aadharno || ''},${u.role}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users.json`;
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
      if (localStorage.getItem('role') === 'admin') fetchUsers();
    }, []);

    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setUsers(res.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const handleDelete = async (id) => {
      try {
        await api.delete(`/admin/dashboard/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    };

    const handleEdit = (item) => {
      navigate('/admin/dashboard', { state: { editing: { ...item, type: 'users' } } });
    };

    const handleSelectItem = (id) => {
      setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
      const allIds = filteredUsers.map(u => u._id);
      setSelectedItems(prev => prev.length === allIds.length ? [] : allIds);
    };

    const handleBulkDelete = async () => {
      if (selectedItems.length === 0) return;
      try {
        await Promise.all(selectedItems.map(id => api.delete(`/admin/dashboard/users/${id}`)));
        setSelectedItems([]);
        fetchUsers();
      } catch (error) {
        console.error('Error bulk deleting users:', error);
      }
    };
  
    const filteredUsers = users.filter(u => {
      const text = filters.text.toLowerCase();
      if (filters.role && u.role !== filters.role) return false;
      if (!text) return true;
      return [u.username, u.fullname, u.email, u.phone, u.role].join(' ').toLowerCase().includes(text);
    });
  return (
    <div className="register-container">
      {/* Section 1: Form Section */}
      <section className="register-form-section">
        <button className="toggle-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide Registration Form' : 'Add New User'}
        </button>
        {isAdmin && (
          <div className="register-upload-section">
            <label htmlFor="user-upload">
              Upload user information using CSV or JSON file
            </label>
            <input
              id="user-upload"
              type="file"
              accept=".csv,.json"
              onChange={e => handleImport(e.target.files[0])}
            />
          </div>
        )}
        <form className={`register-form ${showForm ? 'show' : ''}`} onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Profile Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'block', marginBottom: 8 }}
            />
            {preview && (
              <img src={preview} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginTop: 4 }} />
            )}
          </div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="fullname"
            placeholder="Full Name"
            value={formData.fullname}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="aadharno"
            placeholder="Aadhar Number"
            value={formData.aadharno}
            onChange={handleChange}
            required
          />
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Register User</button>
        </form>
        {message && (
          <div className={`register-message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </section>

      {/* Section 2: Current Users Section */}
      {isAdmin && (
        <section className="register-users-section">
          <h3>Current Users</h3>

          <div className="register-filter-panel">
            <FilterPanel
              fields={[
                { name: 'text', label: 'Search', placeholder: 'Filter by username, email or name...' },
                { name: 'role', label: 'Role', type: 'select', options: [
                  { value: '', label: 'All roles' },
                  { value: 'customer', label: 'Customer' },
                  { value: 'admin', label: 'Admin' }
                ] }
              ]}
              values={filters}
              onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
              onApply={() => {}}
              onReset={() => setFilters({ text: '', role: '' })}
              className="admin-filters"
            />
          </div>

          <div className="register-actions">
            <button onClick={() => handleExport('csv')}>Export CSV</button>
            <button onClick={() => handleExport('json')}>Export JSON</button>
            <input
              type="file"
              accept=".csv,.json"
              onChange={e => handleImport(e.target.files[0])}
            />
            <button onClick={handleBulkDelete} disabled={selectedItems.length === 0}>Delete Selected</button>
            <button onClick={fetchUsers}>Refresh</button>
          </div>

          <table className="register-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(user._id)}
                      onChange={() => handleSelectItem(user._id)}
                    />
                  </td>
                  <td>{user.username}</td>
                  <td>{user.fullname}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleEdit(user)}>Edit</button>
                    <button onClick={() => handleDelete(user._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default Register;
