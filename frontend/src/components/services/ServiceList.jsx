import { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await axios.get(`http://localhost:3000/services?${queryParams}`);
      setServices(response.data);
    } catch (error) {
      setError('Failed to load services');
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="service-list">
      <h1>Hotel Services</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleFilterSubmit} className="filters horizontal-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Service Name:</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by name"
            />
          </div>
          <div className="filter-group">
            <label>Min Price:</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min Price"
            />
          </div>
          <div className="filter-group">
            <label>Max Price:</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max Price"
            />
          </div>
          <button type="submit" className="btn">Apply Filters</button>
        </div>
      </form>

      <div className="services-grid">
        {services.length === 0 ? (
          <p>No services available matching your criteria.</p>
        ) : (
          services.map(service => (
            <div key={service._id} className="service-card">
              <h3>{service.name}</h3>
              <p>Price: ${service.price}</p>
              <p>{service.description}</p>
              {service.status === 'booked' ? (
                <p>Status: {service.status}</p>
              ) : (
                <button className="btn">Book Service</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceList;
