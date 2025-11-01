const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>HotelHub</h3>
          <p>Your perfect stay awaits. Experience luxury and comfort at its finest.</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#rooms">Rooms</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact Info</h3>
          <p>📞 +1 (555) 123-4567</p>
          <p>📧 info@hotelhub.com</p>
          <p>📍 123 Hotel Street, City, State 12345</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 HotelHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
