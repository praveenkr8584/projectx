import { useState, useEffect } from 'react';
import api from '../../api';
import './AdminProfile.css';

const Profile = () => {
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile({
        fullname: response.data.fullname,
        email: response.data.email,
        phone: response.data.phone,
        aadharno: response.data.aadharno,
        image: response.data.image || '',
      });
      if (response.data.image) {
        setImagePreview(`${api.defaults.baseURL}/uploads/${response.data.image}`);
      }
    } catch (error) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const data = new FormData();
      data.append('fullname', profile.fullname);
      data.append('email', profile.email);
      data.append('phone', profile.phone);
      data.append('aadharno', profile.aadharno);
      if (imageFile) data.append('image', imageFile);
      await api.put('/user/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Profile updated successfully');
      setError('');
      setShowEditProfile(false);
      setImageFile(null);
      fetchProfile();
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
      await api.put('/user/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
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

  if (loading) {
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

  return (
    <div className="profile-card">
      <div className="profile-avatar">
        {imagePreview ? (
          <img src={imagePreview} alt="Profile" />
        ) : (
          <span>{profile.fullname?.[0]?.toUpperCase() || 'A'}</span>
        )}
      </div>

      <h2 className="profile-name">{profile.fullname}</h2>
      <div className="profile-username">{profile.username}</div>

      <div className="profile-info">
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Phone:</strong> {profile.phone}</div>
        <div><strong>Aadhar Number:</strong> {profile.aadharno}</div>
      </div>

      <div className="profile-actions">
        <button
          className="edit-btn"
          onClick={() => setShowEditProfile(!showEditProfile)}
        >
          {showEditProfile ? 'Cancel Edit' : 'Edit Profile'}
        </button>
        <button
          className="password-btn"
          onClick={() => setShowChangePassword(!showChangePassword)}
        >
          {showChangePassword ? 'Cancel Change' : 'Change Password'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showEditProfile && (
        <form onSubmit={handleProfileSubmit} className="edit-form">
          <h3 className="form-title">Edit Profile</h3>

          <div className="form-group">
            <label className="form-label">Profile Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="form-input"
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name:</label>
            <input
              type="text"
              name="fullname"
              value={profile.fullname}
              onChange={handleProfileChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email:</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone:</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aadhar Number:</label>
            <input
              type="text"
              name="aadharno"
              value={profile.aadharno}
              onChange={handleProfileChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-btn">
            Update Profile
          </button>
        </form>
      )}

      {showChangePassword && (
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <h3 className="form-title">Change Password</h3>

          <div className="form-group">
            <label className="form-label">Current Password:</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password:</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-btn">
            Change Password
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;
