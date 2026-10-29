import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // Check login response
      if (!response.ok) {
        alert(data.message || "Login failed.");
        return;
      }

      // Check whether user details exist
      if (!data.user || !data.user.name) {
        console.error("Login response:", data);
        alert("User details not received from backend.");
        return;
      }

      // Save logged-in user in browser storage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Show success message
      alert("Login successful! Welcome " + data.user.name);

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      alert("Cannot connect to the server. Please check your backend.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <span className="auth-badge">🛡️ TravelSafe</span>

        <div className="auth-illustration">🌿</div>

        <h1>Your journey, your safety.</h1>

        <p>
          Discover beautiful destinations and plan your next
          adventure with confidence.
        </p>
      </div>

      <div className="auth-form-container">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="auth-eyebrow">WELCOME BACK</span>

          <h2>Sign in to TravelSafe</h2>

          <p className="auth-subtitle">
            Enter your details to access your account.
          </p>

          <label htmlFor="login-email">Email Address</label>

          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button className="auth-submit" type="submit">
            Sign In →
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </p>

          <Link className="back-home" to="/">
            ← Back to Home
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Login;