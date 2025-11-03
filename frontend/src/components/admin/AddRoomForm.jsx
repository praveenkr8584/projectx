import { useState } from 'react';
import axios from 'axios';

const AddRoomForm = () => {
  const url = 'https://projectx-backend-q4wb.onrender.com';
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: '',
    price: '',
    status: 'available',
    features: [],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'features') {
      setFormData({ ...formData, [name]: value.split(',').map(f => f.trim()) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'features') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });
      images.forEach(image => data.append('images', image));
      const token = localStorage.getItem('token');
      await axios.post(`${url}/admin/dashboard/rooms`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Room added successfully!');
      setFormData({
        roomNumber: '',
        type: '',
        price: '',
        status: 'available',
        features: [],
      });
      setImages([]);
      setPreviews([]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add room';
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
    <div>
      <h3>Add New Room</h3>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Hide Form' : 'Show Add Room Form'}
      </button>
      {showForm && (
        <div>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Room Images (optional)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                style={{ display: 'block', marginBottom: 8 }}
              />
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {previews.map((preview, index) => (
                    <img key={index} src={preview} alt={`Preview ${index + 1}`} style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              name="roomNumber"
              placeholder="Room Number"
              value={formData.roomNumber}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="type"
              placeholder="Room Type"
              value={formData.type}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <input
              type="text"
              name="features"
              placeholder="Features (comma separated)"
              value={formData.features.join(', ')}
              onChange={handleChange}
            />
            <button type="submit">Add Room</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
};

export default AddRoomForm;
