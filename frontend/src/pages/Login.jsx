import { useState } from "react";

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form state - strictly empty by default
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("PATIENT"); // Options: ADMIN, DOCTOR, PATIENT
  const [showPassword, setShowPassword] = useState(false);

  // Sign up form state
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupRole, setSignupRole] = useState("PATIENT"); // Only PATIENT or DOCTOR allowed publicly
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleModeSwitch = (signUpMode) => {
    resetFormState();
    setIsSignUp(signUpMode);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          role: selectedRole, // Send selected role for backend verification
        }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403) {
          // Role mismatch rejected by backend authorization
          setErrorMessage(
            responseBody?.message ||
              `Role Mismatch: Your account is not authorized as ${selectedRole}. Please select your registered role.`
          );
        } else if (response.status === 401) {
          setErrorMessage(
            responseBody?.message || "Invalid email or password. Please check your credentials."
          );
        } else {
          setErrorMessage(
            responseBody?.message || "Login failed. Please verify your credentials and try again."
          );
        }
        setIsLoading(false);
        return;
      }

      const data = responseBody;

      // Double-verify returned role in frontend against selected role
      const actualRole = (data.role || "").toUpperCase();
      const expectedRole = (selectedRole || "").toUpperCase();

      if (actualRole !== expectedRole) {
        setErrorMessage(
          `Role Mismatch: This account is registered as a ${actualRole}, but you selected ${expectedRole}. Please switch the role selector to ${actualRole} to log in.`
        );
        setIsLoading(false);
        return;
      }

      // Store JWT token
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // Store logged-in user details including resolved patientId and doctorId
      const userData = {
        userId: data.userId,
        patientId: data.patientId || null,
        doctorId: data.doctorId || null,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Tell App.jsx that login succeeded with authenticated user details
      if (typeof onLogin === "function") {
        onLogin(userData);
      }
    } catch (error) {
      console.error("Login connection error:", error);
      setErrorMessage("Unable to connect to the healthcare backend. Please ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required registration fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    // Enforce role restriction: Public sign-up cannot create Admin accounts
    if (signupRole === "ADMIN") {
      setErrorMessage("Admin accounts cannot be registered publicly. Please contact system support.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedFullName,
          email: trimmedEmail,
          password: password,
          role: signupRole,
        }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          responseBody?.message || "Registration failed. This email may already be in use."
        );
        setIsLoading(false);
        return;
      }

      const data = responseBody;

      // Automatically log the newly registered user in
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      const userData = {
        userId: data.userId,
        patientId: data.patientId || null,
        doctorId: data.doctorId || null,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      if (typeof onLogin === "function") {
        onLogin(userData);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setErrorMessage("Unable to connect to the backend server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo" aria-hidden="true">🏥</div>

        <h1>AI Healthcare</h1>

        <p className="subtitle">
          Intelligent Healthcare Management System
        </p>

        <h2>{isSignUp ? "Create an Account" : "Sign In to Your Account"}</h2>

        {/* Feedback Alert Banners */}
        {errorMessage && (
          <div className="auth-alert-error" role="alert">
            <span className="auth-alert-icon">⚠️</span>
            <div className="auth-alert-content">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success" role="status">
            <span className="auth-alert-icon">✅</span>
            <div className="auth-alert-content">{successMessage}</div>
          </div>
        )}

        {!isSignUp ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleLogin} noValidate>
            {/* Role Selector with Admin, Doctor, and Patient */}
            <div className="role-selector-group">
              <label className="role-selector-label" id="role-selector-heading">
                Login As
              </label>
              <div
                className="role-pills"
                role="radiogroup"
                aria-labelledby="role-selector-heading"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === "PATIENT"}
                  className={`role-pill-btn ${selectedRole === "PATIENT" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRole("PATIENT");
                    setErrorMessage("");
                  }}
                >
                  <span className="role-pill-icon">👤</span>
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === "DOCTOR"}
                  className={`role-pill-btn ${selectedRole === "DOCTOR" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRole("DOCTOR");
                    setErrorMessage("");
                  }}
                >
                  <span className="role-pill-icon">🩺</span>
                  <span>Doctor</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === "ADMIN"}
                  className={`role-pill-btn ${selectedRole === "ADMIN" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRole("ADMIN");
                    setErrorMessage("");
                  }}
                >
                  <span className="role-pill-icon">🛡️</span>
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Email Field - Empty by default, no saved values or sample texts */}
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                autoComplete="off"
                required
              />
            </div>

            {/* Password Field with Working Eye Icon */}
            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : `Login as ${selectedRole === "ADMIN" ? "Admin" : selectedRole === "DOCTOR" ? "Doctor" : "Patient"}`}
            </button>
          </form>
        ) : (
          /* ================= SIGN UP FORM ================= */
          <form onSubmit={handleSignUp} noValidate>
            {/* Public Role Selector: Patient or Doctor only (Admin restricted) */}
            <div className="role-selector-group">
              <label className="role-selector-label" id="signup-role-heading">
                Account Type
              </label>
              <div
                className="role-pills"
                style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
                role="radiogroup"
                aria-labelledby="signup-role-heading"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={signupRole === "PATIENT"}
                  className={`role-pill-btn ${signupRole === "PATIENT" ? "active" : ""}`}
                  onClick={() => {
                    setSignupRole("PATIENT");
                    setErrorMessage("");
                  }}
                >
                  <span className="role-pill-icon">👤</span>
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={signupRole === "DOCTOR"}
                  className={`role-pill-btn ${signupRole === "DOCTOR" ? "active" : ""}`}
                  onClick={() => {
                    setSignupRole("DOCTOR");
                    setErrorMessage("");
                  }}
                >
                  <span className="role-pill-icon">🩺</span>
                  <span>Doctor</span>
                </button>
              </div>

              <div className="admin-restricted-notice">
                ℹ️ Note: Admin accounts are managed by system administrators and cannot be created via public registration.
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                autoComplete="off"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                autoComplete="off"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Toggle between Login and Sign Up */}
        <p className="signup-text">
          {!isSignUp ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => handleModeSwitch(true)}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => handleModeSwitch(false)}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Login;
