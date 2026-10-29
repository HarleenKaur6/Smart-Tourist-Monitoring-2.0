import { useState } from "react";

function Navbar() {
  // Load logged-in user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  // Logout functionality
  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <nav className="navbar">
      {/* Website Logo */}
      <a href="/" className="logo">
        🛡️ TravelSafe
      </a>

      {/* Navigation Links */}
      <div className="nav-links">
        <a href="/">Home</a>
        <a href="#book-tickets">Destinations</a>
        <a href="#guides">Guides</a>
        <a href="#booking-form">Book Tickets</a>
        <a href="#hotels">Hotels</a>
        <a href="#emergency">Emergency</a>
      </div>

      {/* Authentication Section */}
      <div className="nav-auth">
        {user ? (
          <>
            <span className="user-name">
              👤 Hi, {user.name}
            </span>

            <button
              type="button"
              className="register-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="login-link">
              Login
            </a>

            <a href="/register" className="register-btn">
              Create Account
            </a>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;