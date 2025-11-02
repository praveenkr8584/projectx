import { useState } from 'react';
import api from '../../api';
import './Register.css';

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
  return (
    <div className="register-container">
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
        <button type="submit">Register</button>
      </form>
      {message && (
        <div className={`register-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Register;
