import { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const url='https://projectx-backend-q4wb.onrender.com';
  const [profile, setProfile] = useState({
    fullname: '',
    email: '',
    phone: '',
    aadharno: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${url}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({
          fullname: response.data.fullname,
          email: response.data.email,
          phone: response.data.phone,
          aadharno: response.data.aadharno,
          image: response.data.image || '',
        });
        if (response.data.image) {
          setImagePreview(`${url}/uploads/${response.data.image}`);
        }
      } catch (error) {
        setError('Failed to load profile');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('fullname', profile.fullname);
      data.append('email', profile.email);
      data.append('phone', profile.phone);
      data.append('aadharno', profile.aadharno);
      if (imageFile) data.append('image', imageFile);
      await axios.put(`${url}/user/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Profile updated successfully');
      setError('');
      setShowEditProfile(false);
      setImageFile(null);
    } catch (error) {
      setError('Failed to update profile');
      setSuccess('');
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${url}/user/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password changed successfully');
      setError('');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (error) {
      setError('Failed to change password');
      setSuccess('');
      console.error('Error changing password:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h1>My Profile</h1>

      <div className="profile-info">
        {imagePreview ? (
          <img src={imagePreview} alt="Profile" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
        ) : (
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#eee', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700 }}>
            {profile.fullname?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <p><strong>Full Name:</strong> {profile.fullname}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.phone}</p>
        <p><strong>Aadhar Number:</strong> {profile.aadharno}</p>
      </div>

      <div className="profile-actions">
        <button className="btn" onClick={() => setShowEditProfile(!showEditProfile)}>
          {showEditProfile ? 'Cancel Edit' : 'Edit Profile'}
        </button>
        <button className="btn" onClick={() => setShowChangePassword(!showChangePassword)}>
          {showChangePassword ? 'Cancel Change' : 'Change Password'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showEditProfile && (
        <form onSubmit={handleProfileSubmit} className="profile-form" encType="multipart/form-data">
          <h3>Edit Profile</h3>
          <div className="form-group">
            <label>Profile Image:</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginTop: 8 }} />
            )}
          </div>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              name="fullname"
              value={profile.fullname}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Aadhar Number:</label>
            <input
              type="text"
              name="aadharno"
              value={profile.aadharno}
              onChange={handleProfileChange}
              required
            />
          </div>
          <button type="submit" className="btn">Update Profile</button>
        </form>
      )}

      {showChangePassword && (
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <h3>Change Password</h3>
          <div className="form-group">
            <label>Current Password:</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password:</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <button type="submit" className="btn">Change Password</button>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
