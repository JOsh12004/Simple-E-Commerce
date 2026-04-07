import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

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

const Navbar = () => (
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
        <li><Link to="/add"  className="nav-link">Add Pack</Link></li>
        <li><Link to="/login" className="nav-link">Login</Link></li>
      </ul>
    </nav>
  </>
);

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prod_name: "", prod_description: "", image: "", price: "",
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:8800/shoes/${id}`)
      .then(res => {
        const { prod_name, prod_description, image, price } = res.data;
        setForm({ prod_name, prod_description, image, price });
        setFetching(false);
      })
      .catch(() => { setError("Could not load pack data."); setFetching(false); });
  }, [id]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.prod_name || !form.price) {
      setError("Pack name and price are required."); return;
    }
    setLoading(true);
    try {
      await axios.put(`http://localhost:8800/shoes/${id}`, form);
      setSuccess("Pack updated successfully!");
      setTimeout(() => navigate("/item"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update pack.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
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
          background: "radial-gradient(ellipse at 40% 30%, rgba(6,182,212,0.08), transparent 60%)",
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
            <p className="kicker" style={{ marginBottom: "10px" }}>Editing Pack #{id}</p>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: "900",
              letterSpacing: "-2px",
              color: "var(--text)",
              lineHeight: 1,
            }}>
              Update Pack
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

            {fetching && (
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "20px",
                animation: "pulse 1.5s infinite",
              }}>
                Loading pack data...
              </div>
            )}

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
            {form.image && (
              <div style={{
                marginBottom: "28px",
                borderRadius: "12px",
                overflow: "hidden",
                height: "200px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
              }}>
                <img
                  src={form.image}
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
                  placeholder="Pack name"
                />
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
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
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
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  className="btn btn-purple"
                  style={{ flex: 1, justifyContent: "center", padding: "16px", fontSize: "14px" }}
                  disabled={loading || fetching}
                >
                  {loading ? "Saving changes..." : "Save Changes"}
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