import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { clearAuthUser, getAuthHeaders, getAuthUser, isAdminUser } from "../utils/auth";

const PRICE_DATA = [
  { name: "Charizard Base 1st Ed.", price: "₱85,000", change: "+12.4%", up: true },
  { name: "Blastoise Holo", price: "₱42,500", change: "+5.1%", up: true },
  { name: "Lugia Neo Genesis", price: "₱18,700", change: "+8.6%", up: true },
  { name: "Mewtwo Base Set", price: "₱12,400", change: "-0.5%", up: false },
  { name: "Rayquaza ex", price: "₱7,800", change: "+3.9%", up: true },
  { name: "Umbreon VMAX Alt Art", price: "₱24,600", change: "+14.7%", up: true },
];

const TickerItems = () =>
  PRICE_DATA.map((item, i) => (
    <span key={i} className="ticker-item">
      <span className="ticker-name">{item.name}</span>
      <span className="ticker-price">{item.price}</span>
      <span className={item.up ? "ticker-up" : "ticker-down"}>
        {item.up ? "▲" : "▼"} {item.change}
      </span>
      <span className="ticker-sep">·</span>
    </span>
  ));

const Navbar = ({ isAdmin, isLoggedIn, onLogout }) => (
  <>
    <div className="price-ticker" style={{ position: "fixed", top: 0, left: 0, zIndex: 1001 }}>
      <div className="ticker-track"><TickerItems /><TickerItems /></div>
    </div>
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        TCG<span style={{ color: "var(--masterball-light)" }}>Vault</span>
      </Link>
      <ul className="nav-links">
        <li><Link to="/"     className="nav-link">Home</Link></li>
        <li><Link to="/item" className="nav-link">Collection</Link></li>
        {isLoggedIn && <li><Link to="/orders" className="nav-link">Orders</Link></li>}
        {isAdmin && <li><Link to="/add" className="nav-link active">Add Pack</Link></li>}
        {isLoggedIn ? (
          <li>
            <button type="button" className="nav-link" style={{ background: "transparent", cursor: "pointer" }} onClick={onLogout}>
              Logout
            </button>
          </li>
        ) : (
          <li><Link to="/login" className="nav-link">Login</Link></li>
        )}
      </ul>
    </nav>
  </>
);

export default function Add() {
  const [form, setForm] = useState({
    prod_name: "",
    prod_description: "",
    images: "",
    price: "",
    quantity: "0",
    category: "",
    rating: "",
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const navigate = useNavigate();
  const isAdmin = isAdminUser();
  const isLoggedIn = Boolean(authUser);

  const handleLogout = () => {
    clearAuthUser();
    setAuthUser(null);
    navigate("/login");
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/item");
    }
  }, [isAdmin, navigate]);

  const mapServerErrors = (serverErrors = []) => {
    const mapped = {};

    serverErrors.forEach((item) => {
      if (!item) return;

      if (typeof item === "string") {
        if (!mapped._global) mapped._global = [];
        mapped._global.push(item);
        return;
      }

      const field = item.field || "_global";
      const message = item.message || "Invalid input.";
      if (!mapped[field]) mapped[field] = [];
      mapped[field].push(message);
    });

    return mapped;
  };

  const validateClient = () => {
    const next = {};
    const title = form.prod_name.trim();
    const description = form.prod_description.trim();
    const price = Number(form.price);
    const images = form.images
      .split(/\r?\n|,/) 
      .map((item) => item.trim())
      .filter(Boolean);
    const quantityProvided = form.quantity !== "";
    const quantity = Number(form.quantity);
    const ratingProvided = form.rating !== "";
    const rating = Number(form.rating);

    const urlRegex = /^https?:\/\//i;

    if (title.length < 3 || title.length > 120) next.prod_name = ["Title must be between 3 and 120 characters."];
    if (description.length < 10 || description.length > 2000) next.prod_description = ["Description must be between 10 and 2000 characters."];
    if (!Number.isFinite(price) || price <= 0) next.price = ["Price must be a numeric value greater than 0."];
    if (images.length < 1) next.images = ["At least one image URL is required."];
    else if (images.some((img) => !urlRegex.test(img))) next.images = ["All images must be valid http/https URLs."];
    if (quantityProvided && (!Number.isInteger(quantity) || quantity < 0)) next.quantity = ["Quantity must be an integer value of 0 or higher."];
    if (ratingProvided && (!Number.isFinite(rating) || rating < 1 || rating > 5)) next.rating = ["Rating must be a number from 1 to 5 when provided."];

    return next;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const clientErrors = validateClient();
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const images = form.images
        .split(/\r?\n|,/) 
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        prod_name: form.prod_name,
        prod_description: form.prod_description,
        images,
        price: form.price,
        quantity: form.quantity,
        category: form.category,
        rating: form.rating,
      };

      await axios.post("http://localhost:8800/shoes", payload, { headers: getAuthHeaders() });
      setSuccess("Pack added to the vault!");
      setFieldErrors({});
      setTimeout(() => navigate("/item"), 1200);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        setFieldErrors(mapServerErrors(serverErrors));
        setError(err.response?.data?.message || "Validation failed.");
      } else {
        setError(err.response?.data?.error || "Failed to add pack.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="page" style={{
        background: "var(--bg)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "60px 24px 80px",
      }}>
        {/* Background gradient */}
        <div style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse at 60% 20%, rgba(98,45,143,0.12), transparent 60%)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: "100%",
          maxWidth: "600px",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
            <p className="kicker" style={{ marginBottom: "10px" }}>Inventory Management</p>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: "900",
              letterSpacing: "-2px",
              color: "var(--text)",
              lineHeight: 1,
            }}>
              Add New Pack
            </h1>
            <div className="divider" style={{ marginTop: "16px" }} />
          </div>

          {/* Form card */}
          <div style={{
            background: "rgba(31, 41, 55, 0.7)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid var(--border-hi)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          }}>
            {/* Top accent line */}
            <div style={{
              position: "absolute",
              top: 0, left: "32px", right: "32px",
              height: "3px",
              background: "linear-gradient(90deg, var(--holo-gold), var(--masterball-light))",
              borderRadius: "0 0 3px 3px",
              marginTop: "-1px",
              display: "none",
            }} />

            {error && (
              <div className="alert alert-error" style={{ marginBottom: "24px" }}>
                <span>⚠</span><span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginBottom: "24px" }}>
                <span>✓</span><span>{success}</span>
              </div>
            )}

            {/* Image preview */}
            {form.images && (
              <div style={{
                marginBottom: "28px",
                borderRadius: "12px",
                overflow: "hidden",
                height: "200px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
              }}>
                <img
                  src={form.images.split(/\r?\n|,/).map((item) => item.trim()).find(Boolean)}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => e.target.style.display = "none"}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div className="form-group">
                <label>Pack Name *</label>
                <input
                  name="prod_name"
                  value={form.prod_name}
                  onChange={handleChange}
                  placeholder="e.g. Scarlet & Violet 151 Booster Box"
                />
                {fieldErrors.prod_name?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="prod_description"
                  value={form.prod_description}
                  onChange={handleChange}
                  placeholder="Set details, card count, rarity distribution..."
                  style={{ minHeight: "100px" }}
                />
                {fieldErrors.prod_description?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Image URLs * (comma or new line separated)</label>
                <textarea
                  name="images"
                  value={form.images}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={{ minHeight: "80px" }}
                />
                {fieldErrors.images?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Price (₱) *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                {fieldErrors.price?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
                {fieldErrors.quantity?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Booster Box, Elite Trainer Box..."
                />
              </div>

              <div className="form-group">
                <label>Rating (1-5)</label>
                <input
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={handleChange}
                  placeholder="4.5"
                />
                {fieldErrors.rating?.map((msg, idx) => (
                  <div key={idx} style={{ color: "#fca5a5", marginTop: "6px", fontSize: "12px" }}>{msg}</div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  className="btn btn-purple"
                  style={{ flex: 1, justifyContent: "center", padding: "16px", fontSize: "14px" }}
                  disabled={loading}
                >
                  {loading ? "Adding to vault..." : "Add to Vault"}
                </button>
                <Link
                  to="/item"
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: "center", textAlign: "center", padding: "16px", fontSize: "14px" }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}