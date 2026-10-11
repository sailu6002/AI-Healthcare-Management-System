import { useState } from "react";
import { login, register } from "../api/auth";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!email || !password || (isRegister && !fullName)) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const session = isRegister
        ? await register({ fullName, email, password })
        : await login(email, password);

      onLogin(session);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
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

        <h2>{isRegister ? "Create Account" : "Login"}</h2>

        <form onSubmit={handleSubmit}>

          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p
              style={{
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
                ? "Sign Up"
                : "Login"}
          </button>

        </form>

        <p className="signup-text">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span
            onClick={isSubmitting ? undefined : switchMode}
            style={{ cursor: isSubmitting ? "default" : "pointer" }}
          >
            {isRegister ? "Login" : "Sign Up"}
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;
