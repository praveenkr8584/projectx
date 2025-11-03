import { Link } from 'react-router-dom';

const Navbar = ({ isLoggedIn, role, handleLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <span className="hotel-icon">🏨</span>
          <span className="brand-name">HotelHub</span>
        </div>
      </div>
      <div className="navbar-center">
        {!isLoggedIn && (
          <>
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/rooms">Rooms</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </>
        )}
        {isLoggedIn && role !== 'admin' && (
          <>
            <Link to="/">Home</Link>
            <Link to="/user/dashboard">Dashboard</Link>
            <Link to="/user/bookings">My Bookings</Link>
            <Link to="/user/profile">Profile</Link>
            <Link to="/rooms">Rooms</Link>
            <Link to="/services">Services</Link>
            <Link to="/user/notifications">Notifications</Link>
          </>
        )}
        {isLoggedIn && role === 'admin' && (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/profile">Profile</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/bookings">Bookings</Link>
            <Link to="/admin/add-room">Rooms</Link>
            <Link to="/admin/add-service">Services</Link>
          </>
        )}
      </div>
      <div className="navbar-right">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        ) : (
          <>
            {role !== 'admin' && <Link to="/booking">Book Room</Link>}
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
