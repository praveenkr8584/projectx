import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  
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
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
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
            <label htmlFor="user-upload" style={{
              fontWeight: 500,
              marginBottom: '0.5rem',
              fontSize: '1rem',
              color: '#333'
            }}>
              upload user information using csv or json file
            </label>
            <input
              id="user-upload"
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
      {message && <p>{message}</p>}
      {isAdmin && (
        <div style={{ marginTop: 20 }}>
          <h3>Users</h3>

          {/* Export and file input just below Users headline */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <button onClick={() => handleExport('csv')}>Export CSV</button>
            <button onClick={() => handleExport('json')}>Export JSON</button>
            <input
              type="file"
              accept=".csv,.json"
              onChange={e => handleImport(e.target.files[0])}
              style={{ marginLeft: 8 }}
            />
            <button onClick={handleBulkDelete} disabled={selectedItems.length === 0}>Delete Selected</button>
            <button onClick={fetchUsers}>Refresh</button>
          </div>

          {/* Reusable FilterPanel (replaces old inline filters) */}
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

          <DataTable
            data={filteredUsers}
            type="users"
            selectedItems={selectedItems}
            onSelectItem={(t, id) => handleSelectItem(id)}
            onSelectAll={() => handleSelectAll()}
            onEdit={(item) => handleEdit(item)}
            onDelete={(t, id) => handleDelete(id)}
          />
        </div>
      )}
    </div>
  );
};

export default Register;
