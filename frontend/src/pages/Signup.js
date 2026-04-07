import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* BG circles */}
      <div style={{
        position: "absolute", top: "-100px", left: "-200px",
        width: "600px", height: "600px", borderRadius: "50%",
        border: "80px solid rgba(227,0,11,0.06)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-150px", right: "-100px",
        width: "500px", height: "500px", borderRadius: "50%",
        border: "60px solid rgba(255,215,0,0.05)", pointerEvents: "none",
      }} />

      <div className="auth-box">
        <Link to="/" style={{ textDecoration: "none" }}>
          <div className="auth-title">PokeHub</div>
        </Link>
        <p className="auth-subtitle">Create your trainer account</p>

        {error   && <div className="auth-error"   style={{ marginBottom: "20px" }}>{error}</div>}
        {success && <div className="auth-success" style={{ marginBottom: "20px" }}>{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Trainer Name</label>
            <input
              type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Ash Ketchum"
            />
          </div>
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
              onChange={handleChange} placeholder="Min. 6 characters"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="Repeat password"
            />
          </div>

          <button
            type="submit" className="btn btn-yellow"
            style={{ fontSize: "16px", padding: "14px", width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>

        <div style={{
          margin: "24px 0 0", height: "3px",
          background: "linear-gradient(90deg, var(--yellow) 50%, var(--red) 50%)",
          opacity: 0.4,
        }} />
      </div>
    </div>
  );
}