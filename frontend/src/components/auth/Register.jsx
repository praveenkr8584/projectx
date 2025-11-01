import { useState } from 'react';
import axios from 'axios';

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
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (image) data.append('image', image);
      // Only send Authorization header if token exists and is not 'null' or empty
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await axios.post('http://localhost:3000/register', data, { headers });
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
      const content = format === 'csv' ? 'username,fullname,email,phone,aadharno,role\n' : JSON.stringify(formData, null, 2);
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const handleImport = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => alert('Imported file content: ' + e.target.result);
      reader.readAsText(file);
    };
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
    </div>
  );
};

export default Register;
