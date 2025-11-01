import { useNavigate } from 'react-router-dom';

const CTASection = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="cta-section">
      <h2>Ready to Book Your Stay?</h2>
      <p>Join thousands of satisfied guests who choose HotelHub for their accommodation needs.</p>
      {!isLoggedIn && (
        <button className="btn-primary" onClick={handleGetStarted}>
          Start Your Journey
        </button>
      )}
    </div>
  );
};

export default CTASection;
