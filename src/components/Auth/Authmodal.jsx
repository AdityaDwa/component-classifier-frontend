import { useState } from "react";
import "./AuthModal.css";

// ── Validation ────────────────────────────────────────────────────────────────
function validateLogin(email, password) {
  const errors = { email: "", password: "" };
  if (!email) errors.email = "Email is required.";
  else if (!/\S+@\S+\.\S+/.test(email))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

function validateSignup(username, email, password, confirmPassword) {
  const errors = { username: "", email: "", password: "", confirmPassword: "" };
  if (!username) errors.username = "Username is required.";
  else if (username.length < 3) errors.username = "Min. 3 characters.";
  else if (!/^[a-zA-Z0-9_]+$/.test(username))
    errors.username = "Letters, numbers, underscores only.";
  if (!email) errors.email = "Email is required.";
  else if (!/\S+@\S+\.\S+/.test(email))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8) errors.password = "Min. 8 characters.";
  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

//logo and name
function ModalLogo() {
  return (
    <div className="amodal-logo">
      {/* <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#6366f1" />
        <path
          d="M8 14h12M14 8v12"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg> */}
      <span className="amodal-logo-name">UI Evaluator</span>
    </div>
  );
}

//Login form
function LoginForm({ onSuccess, onGoToSignup, signupSuccessEmail }) {
  // if user just signed up, prefill their email so they can sign in immediately
  const [email, setEmail] = useState(signupSuccessEmail || "");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const newErrors = validateLogin(email.trim(), password);
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-id": localStorage.getItem("guestId"),
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || "Login failed. Please try again.");
        return;
      }
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      onSuccess(data.data.accessToken);
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* header */}
      <div className="amodal-header">
        <ModalLogo />
        <h2 className="amodal-title">Welcome back</h2>
        <p className="amodal-subtitle">Sign in to your account</p>
      </div>

      {/* success message shown after signup redirect */}
      {signupSuccessEmail && (
        <div className="amodal-success-banner">
          Account created! Sign in to continue.
        </div>
      )}

      {serverError && <div className="amodal-server-error">{serverError}</div>}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="amodal-form"
        autoComplete="off"
      >
        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-login-email">
            Email <span className="amodal-required">*</span>
          </label>
          <input
            id="m-login-email"
            type="email"
            className={`amodal-input ${errors.email ? "amodal-input--error" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
              setServerError("");
            }}
          />
          <div className="amodal-error-msg">{errors.email}</div>
        </div>

        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-login-password">
            Password <span className="amodal-required">*</span>
          </label>
          <div className="amodal-input-wrap">
            <input
              id="m-login-password"
              type={isPasswordVisible ? "text" : "password"}
              className={`amodal-input ${errors.password ? "amodal-input--error" : ""}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
                setServerError("");
              }}
            />
            <button
              type="button"
              className="amodal-visibility-btn"
              onClick={() => setIsPasswordVisible((v) => !v)}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M2 2l12 12"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="amodal-error-msg">{errors.password}</div>
        </div>

        <button type="submit" className="amodal-submit-btn" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="amodal-switch">
        Don't have an account?{" "}
        <button
          type="button"
          className="amodal-switch-btn"
          onClick={onGoToSignup}
        >
          Sign up
        </button>
      </p>
    </>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────────
function SignupForm({ onSignupComplete, onGoToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearFieldError(field) {
    setErrors((err) => ({ ...err, [field]: "" }));
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const newErrors = validateSignup(
      username.trim(),
      email.trim(),
      password,
      confirmPassword,
    );
    setErrors(newErrors);
    if (Object.values(newErrors).some((m) => m !== "")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-id": localStorage.getItem("guestId"),
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || "Signup failed. Please try again.");
        return;
      }
      // account created — no token yet
      // pass email back so login form can prefill it
      onSignupComplete(email.trim());
      localStorage.removeItem("guestId");
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* header */}
      <div className="amodal-header">
        <ModalLogo />
        <h2 className="amodal-title">Create an account</h2>
        <p className="amodal-subtitle">Start evaluating your UI designs</p>
      </div>

      {serverError && <div className="amodal-server-error">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate className="amodal-form">
        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-signup-username">
            Username <span className="amodal-required">*</span>
          </label>
          <input
            id="m-signup-username"
            type="text"
            className={`amodal-input ${errors.username ? "amodal-input--error" : ""}`}
            placeholder="Min. 3 characters"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              clearFieldError("username");
            }}
            autoComplete="username"
          />
          <div className="amodal-error-msg">{errors.username}</div>
        </div>

        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-signup-email">
            Email <span className="amodal-required">*</span>
          </label>
          <input
            id="m-signup-email"
            type="email"
            className={`amodal-input ${errors.email ? "amodal-input--error" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            autoComplete="email"
          />
          <div className="amodal-error-msg">{errors.email}</div>
        </div>

        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-signup-password">
            Password <span className="amodal-required">*</span>
          </label>
          <div className="amodal-input-wrap">
            <input
              id="m-signup-password"
              type={isPasswordVisible ? "text" : "password"}
              className={`amodal-input ${errors.password ? "amodal-input--error" : ""}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="amodal-visibility-btn"
              onClick={() => setIsPasswordVisible((v) => !v)}
            >
              {isPasswordVisible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M2 2l12 12"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="amodal-error-msg">{errors.password}</div>
        </div>

        <div className="amodal-field">
          <label className="amodal-label" htmlFor="m-confirm-password">
            Confirm Password <span className="amodal-required">*</span>
          </label>
          <div className="amodal-input-wrap">
            <input
              id="m-confirm-password"
              type={isConfirmPasswordVisible ? "text" : "password"}
              className={`amodal-input ${errors.confirmPassword ? "amodal-input--error" : ""}`}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="amodal-visibility-btn"
              onClick={() => setIsConfirmPasswordVisible((v) => !v)}
            >
              {isConfirmPasswordVisible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M2 2l12 12"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="amodal-error-msg">{errors.confirmPassword}</div>
        </div>

        <button type="submit" className="amodal-submit-btn" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="amodal-switch">
        Already have an account?{" "}
        <button
          type="button"
          className="amodal-switch-btn"
          onClick={onGoToLogin}
        >
          Sign in
        </button>
      </p>
    </>
  );
}

//Main AuthModal component
export default function AuthModal({
  reason,
  onSuccess,
  onDismiss,
  dismissable = true,
}) {
  // three possible views inside the modal
  // "login" which shows login form
  // "signup" which shows signup form
  // "signup-success" which shows brief success screen before redirecting to login
  const [modalView, setModalView] = useState("login");

  // stores the email after signup so login form can prefill it
  const [signupEmail, setSignupEmail] = useState("");

  // reason-based heading shown only on login view when triggered by timer/save
  const reasonMessages = {
    timer: "Your guest session has ended. Sign in to keep your results.",
    save: "Sign in or create an account to save your results.",
    expired: "Your session has expired. Please sign in again to continue.",
  };

  // called by SignupForm on success — no token, just account created
  function handleSignupComplete(email) {
    setSignupEmail(email); // store email to prefill login
    setModalView("signup-success");

    // auto-redirect to login after 2.5 seconds
    setTimeout(() => setModalView("login"), 2500);
  }

  // only close on backdrop click if dismissable
  function handleBackdropClick(e) {
    if (!dismissable) return; // ← block dismiss
    if (e.target === e.currentTarget) onDismiss();
  }

  return (
    <div className="amodal-backdrop" onClick={handleBackdropClick}>
      <div className="amodal-box" role="dialog" aria-modal="true">
        {/* close button — always visible */}
        {dismissable && (
          <button
            className="amodal-close"
            onClick={onDismiss}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* reason banner — only shown on login view when triggered by timer or save */}
        {modalView === "login" && reason && reasonMessages[reason] && (
          <div className="amodal-reason-banner">{reasonMessages[reason]}</div>
        )}

        {/*Login view */}
        {modalView === "login" && (
          <LoginForm
            onSuccess={onSuccess}
            onGoToSignup={() => setModalView("signup")}
            signupSuccessEmail={signupEmail}
          />
        )}

        {/*Signup view*/}
        {modalView === "signup" && (
          <SignupForm
            onSignupComplete={handleSignupComplete}
            onGoToLogin={() => setModalView("login")}
          />
        )}

        {/*Signup success view*/}
        {modalView === "signup-success" && (
          <div className="amodal-success-screen">
            <div className="amodal-success-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle
                  cx="16"
                  cy="16"
                  r="15"
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 16l5 5 9-9"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="amodal-success-title">Account created!</h2>
            <p className="amodal-success-sub">Redirecting you to sign in…</p>
            <button
              type="button"
              className="amodal-submit-btn"
              style={{ marginTop: "1.25rem" }}
              onClick={() => setModalView("login")}
            >
              Sign in now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
