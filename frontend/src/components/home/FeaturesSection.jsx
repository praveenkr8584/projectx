const FeaturesSection = () => {
  return (
    <div className="features-section">
      <h2 className="section-title">Why Choose HotelHub?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🛏️</div>
          <h3>Comfortable Rooms</h3>
          <p>Spacious and well-equipped rooms for your comfort</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🍽️</div>
          <h3>Fine Dining</h3>
          <p>Experience world-class cuisine at our restaurants</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏊‍♂️</div>
          <h3>Amenities</h3>
          <p>Swimming pool, gym, spa, and more facilities</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Prime Location</h3>
          <p>Located in the heart of the city with easy access</p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
