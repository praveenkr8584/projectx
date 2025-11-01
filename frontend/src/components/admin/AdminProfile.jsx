import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      if (response.data.image) {
        setImagePreview(`http://localhost:3000/uploads/${response.data.image}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('image', imageFile);
      await axios.put('http://localhost:3000/user/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchProfile();
      setImageFile(null);
    } catch (error) {
      alert('Failed to upload image');
    }
  };

  if (!profile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        fontSize: '1.2rem',
        color: '#888'
      }}>
        Loading profile...
      </div>
    );
  }

  // Modern stylish card look
  return (
    <div style={{
      maxWidth: 400,
      margin: '2rem auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 18,
      boxShadow: '0 6px 24px rgba(102,126,234,0.15)',
      padding: '2.5rem 2rem 2rem 2rem',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        width: 90,
        height: 90,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        margin: '0 auto 1.5rem auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {imagePreview ? (
          <img src={imagePreview} alt="Profile" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 2
          }}>{profile.fullname?.[0]?.toUpperCase() || 'A'}</span>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ marginTop: 8 }}
        />
        {imageFile && (
          <button onClick={handleImageUpload} style={{ marginLeft: 8, padding: '0.3rem 1rem', borderRadius: 6, border: 'none', background: '#fff', color: '#764ba2', fontWeight: 600, cursor: 'pointer' }}>Upload</button>
        )}
      </div>
      <h2 style={{ fontWeight: 700, fontSize: '1.6rem', marginBottom: 8 }}>{profile.fullname}</h2>
      <div style={{ fontSize: '1.1rem', marginBottom: 16, opacity: 0.92 }}>{profile.username}</div>
      <div style={{
        background: 'rgba(255,255,255,0.10)',
        borderRadius: 10,
        padding: '1rem',
        marginBottom: 10,
        textAlign: 'left',
        color: '#f3f3f3',
        fontSize: '1rem'
      }}>
        <div style={{ marginBottom: 8 }}><strong>Email:</strong> {profile.email}</div>
        <div style={{ marginBottom: 8 }}><strong>Phone:</strong> {profile.phone}</div>
        <div><strong>Aadhar Number:</strong> {profile.aadharno}</div>
      </div>
    </div>
  );
};

export default Profile;
