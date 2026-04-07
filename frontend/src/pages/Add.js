import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="nav-logo">PokeHub</Link>
    <ul className="nav-links">
      <li><Link to="/"      className="nav-link">Home</Link></li>
      <li><Link to="/item"  className="nav-link">Shop</Link></li>
      <li><Link to="/add"   className="nav-link active">Add Pack</Link></li>
      <li><Link to="/login" className="nav-link">Login</Link></li>
    </ul>
  </nav>
);

export default function Add() {
  const [form, setForm] = useState({
    prod_name: "", prod_description: "", image: "", price: "",
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.prod_name || !form.price) {
      setError("Pack name and price are required."); return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8800/shoes", form);
      setSuccess("Pack added successfully!");
      setTimeout(() => navigate("/item"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add pack.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page" style={{
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "60px 20px", background: "var(--black)",
      }}>
        <div style={{
          width: "100%", maxWidth: "560px",
          background: "var(--surface)",
          borderTop: "4px solid var(--yellow)",
          border: "2px solid var(--border)",
          borderTop: "4px solid var(--yellow)",
          padding: "48px 40px",
        }}>
          {/* Title */}
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: "12px",
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--red)", marginBottom: "8px",
          }}>Inventory</p>
          <h1 style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "52px", letterSpacing: "3px",
            color: "var(--yellow)", textShadow: "3px 3px 0 var(--red)",
          }}>ADD NEW PACK</h1>
          <div className="divider" />

          {error   && <div className="auth-error"   style={{ marginBottom: "20px" }}>{error}</div>}
          {success && <div className="auth-success" style={{ marginBottom: "20px" }}>{success}</div>}

          {/* Preview */}
          {form.image && (
            <div style={{
              marginBottom: "24px",
              border: "2px solid var(--border)",
              overflow: "hidden",
              height: "200px",
            }}>
              <img
                src={form.image}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => e.target.style.display = "none"}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label>Pack Name *</label>
              <input
                name="prod_name" value={form.prod_name}
                onChange={handleChange} placeholder="e.g. Scarlet & Violet Elite Trainer Box"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="prod_description" value={form.prod_description}
                onChange={handleChange} placeholder="What's inside this pack? Cards, sets, rarity..."
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                name="image" value={form.image}
                onChange={handleChange} placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Price (₱) *</label>
              <input
                name="price" type="number" step="0.01" min="0"
                value={form.price} onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                type="submit" className="btn btn-yellow"
                style={{ flex: 1, fontSize: "16px", padding: "14px" }}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Pack"}
              </button>
              <Link to="/item" className="btn btn-outline"
                style={{ flex: 1, fontSize: "16px", padding: "14px", textAlign: "center" }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}