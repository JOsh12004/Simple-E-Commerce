import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:8800/login", form);
      navigate("/item");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      {/* Background grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(98,45,143,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(98,45,143,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Left brand panel */}
      <div style={{
        display: "none",
        position: "absolute",
        left: "10%",
        top: "50%",
        transform: "translateY(-50%)",
      }}>
        {/* Desktop branding - hidden on smaller screens */}
      </div>

      <div className="auth-box">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <div className="auth-logo-dot" />
            <span style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: "900",
              letterSpacing: "-0.5px",
              color: "var(--text)",
            }}>
              TCG<span style={{ color: "var(--masterball-light)" }}>Vault</span>
            </span>
          </div>
        </Link>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "28px",
          fontWeight: "900",
          letterSpacing: "-0.8px",
          color: "var(--text)",
          marginBottom: "6px",
        }}>
          Welcome back
        </h1>

        <p className="auth-subtitle">Sign in to access your collection</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="trainer@tcgvault.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "14px", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ animation: "pulse 1s infinite" }}>◆</span>
                Signing in...
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <div className="divider-full" />

        <div className="auth-footer">
          New to the vault? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}