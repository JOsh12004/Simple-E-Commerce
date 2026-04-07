import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:8800/login", form);
      navigate("/item");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* BG circles */}
      <div style={{
        position: "absolute", top: "-150px", right: "-150px",
        width: "600px", height: "600px", borderRadius: "50%",
        border: "80px solid rgba(227,0,11,0.07)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-200px", left: "-100px",
        width: "500px", height: "500px", borderRadius: "50%",
        border: "60px solid rgba(255,215,0,0.05)", pointerEvents: "none",
      }} />

      <div className="auth-box">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none" }}>
          <div className="auth-title">PokeHub</div>
        </Link>
        <p className="auth-subtitle">Sign in to your trainer account</p>

        {error && <div className="auth-error" style={{ marginBottom: "20px" }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="trainer@pokehub.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••"
            />
          </div>

          <button
            type="submit" className="btn btn-primary"
            style={{ fontSize: "16px", padding: "14px", width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Register here</Link>
        </div>

        {/* Pokeball divider */}
        <div style={{
          margin: "24px 0 0",
          height: "3px",
          background: "linear-gradient(90deg, var(--red) 50%, var(--yellow) 50%)",
          opacity: 0.4,
        }} />
      </div>
    </div>
  );
}