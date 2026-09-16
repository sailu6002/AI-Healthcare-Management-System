import { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    if (email && password) {
      onLogin();
    } else {
      alert("Please enter your email and password.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="logo">🏥</div>

        <h1>AI Healthcare</h1>

        <p className="subtitle">
          Healthcare Management System
        </p>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>

        </form>

        <p className="signup-text">
          Don't have an account? <span>Sign Up</span>
        </p>

      </div>
    </div>
  );
}

export default Login;