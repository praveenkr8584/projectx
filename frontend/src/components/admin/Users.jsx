import { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Users = () => {
  const [showAddSection, setShowAddSection] = useState(false);
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
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
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
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

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
    <div className="users-container">
      {/* Section 1: Fixed Filter Panel */}
      <section className="users-filter-section">
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
      </section>

      {/* Section 2: Add User Section */}
      <section className="users-add-section">
        <button className="toggle-button" onClick={() => setShowAddSection(!showAddSection)}>
          {showAddSection ? 'Hide Add User Section' : 'Add New User'}
        </button>
        {showAddSection && (
          <div className="add-user-content">
            {/* Upload Section */}
            <div className="users-upload-section">
              <h4>Upload Users</h4>
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

            {/* Registration Form */}
            <div className="users-form-section">
              <h4>Manual Registration</h4>
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
              {message && (
                <div className={`users-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Users List Section */}
      <section className="users-list-section">
        <h3>Current Users</h3>

        <div className="users-actions">
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

        <DataTable
          data={filteredUsers}
          type="users"
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

export default Users;
