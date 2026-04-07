import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required."); return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8800/signup", {
        name: form.name, email: form.email, password: form.password,
      });
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb" style={{
        width: "600px", height: "600px",
        background: "rgba(98, 45, 143, 0.18)",
        top: "-200px", left: "-150px",
        position: "absolute", borderRadius: "50%", filter: "blur(80px)",
      }} />
      <div className="auth-bg-orb" style={{
        width: "400px", height: "400px",
        background: "rgba(6, 182, 212, 0.1)",
        bottom: "-100px", right: "-80px",
        position: "absolute", borderRadius: "50%", filter: "blur(80px)",
      }} />

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

      <div className="auth-box">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          Start your collection
        </h1>

        <p className="auth-subtitle">Create a free account and open the vault</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: "24px" }}>
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Trainer Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ash Ketchum"
              autoComplete="name"
            />
          </div>

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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 chars"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>Confirm</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-purple"
            style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "14px", marginTop: "4px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ animation: "pulse 1s infinite" }}>◆</span>
                Creating account...
              </>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <div className="divider-full" />

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}