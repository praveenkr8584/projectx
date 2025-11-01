import { useNavigate } from 'react-router-dom';

const HeroSection = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      navigate('/user/dashboard');
    }
  };

  const handleExplore = () => {
    if (!isLoggedIn) {
      navigate('/register');
    } else {
      navigate('/rooms');
    }
  };

  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Welcome to <span className="highlight">HotelHub</span>
        </h1>
        <p className="hero-subtitle">
          Experience luxury and comfort at your fingertips. Book your perfect stay with ease.
        </p>
        {!isLoggedIn && (
          <div className="hero-buttons">
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started
            </button>
            <button className="btn-secondary" onClick={handleExplore}>
              Explore More
            </button>
          </div>
        )}
      </div>
      <div className="hero-image">
        <div className="image-placeholder">
          <div className="hotel-icon">🏨</div>
          <p>Luxury Accommodations</p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
