import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthUser, getAuthUser, isAdminUser } from "../utils/auth";

const PRICE_DATA = [
  { name: "Charizard Base 1st Ed.", price: "₱85,000", change: "+12.4%", up: true },
  { name: "Blastoise Holo", price: "₱42,500", change: "+5.1%", up: true },
  { name: "Venusaur 1st Ed.", price: "₱38,200", change: "-1.8%", up: false },
  { name: "Pikachu Illustrator", price: "₱920,000", change: "+31.2%", up: true },
  { name: "Lugia Neo Genesis", price: "₱18,700", change: "+8.6%", up: true },
  { name: "Mewtwo Base Set", price: "₱12,400", change: "-0.5%", up: false },
  { name: "Rayquaza ex", price: "₱7,800", change: "+3.9%", up: true },
  { name: "Umbreon VMAX Alt Art", price: "₱24,600", change: "+14.7%", up: true },
  { name: "Gengar ex Alt Art", price: "₱9,200", change: "+2.1%", up: true },
  { name: "Ancient Mew Promo", price: "₱3,100", change: "-4.2%", up: false },
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
    {/* Price Ticker */}
    <div className="price-ticker" style={{ position: "fixed", top: 0, left: 0, zIndex: 1001 }}>
      <div className="ticker-track">
        <TickerItems />
        <TickerItems />
      </div>
    </div>

    {/* Main Nav */}
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        TCG<span>Vault</span>
      </Link>
      <ul className="nav-links">
        <li><Link to="/"      className="nav-link active">Home</Link></li>
        <li><Link to="/item"  className="nav-link">Collection</Link></li>
        {isLoggedIn && <li><Link to="/orders" className="nav-link">Orders</Link></li>}
        {isAdmin && <li><Link to="/add" className="nav-link">Add Pack</Link></li>}
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

export default function Main() {
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const navigate = useNavigate();
  const isAdmin = isAdminUser();
  const isLoggedIn = Boolean(authUser);

  const handleLogout = () => {
    clearAuthUser();
    setAuthUser(null);
    navigate("/login");
  };

  return (
    <>
      <Navbar isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="page">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">Premium Pokémon Collectibles</div>
            <h1 className="hero-headline">TCG Vault</h1>
            <p className="hero-subheadline">Discover rare, graded trading cards from the world's most coveted collections. Experience the digital gallery.</p>
            <div className="hero-cta">
              <Link to="/item" className="btn btn-primary">Browse Collection</Link>
              <Link to={isLoggedIn ? "#" : "/login"} className="btn btn-outline">Get Started</Link>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div style={{ height: "1px", background: "var(--border)", margin: "0" }} />

        {/* ── FEATURED SECTION ── */}
        <section style={{
          padding: "60px 48px",
          background: "var(--bg)",
          textAlign: "center",
        }}>
          <div style={{ marginBottom: "48px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "12px",
            }}>Real-time Market Data</div>
            <h2 style={{
              fontSize: "32px",
              fontWeight: "800",
              letterSpacing: "-0.8px",
              color: "var(--text)",
              marginBottom: "8px",
            }}>Featured This Week</h2>
            <p style={{
              fontSize: "16px",
              color: "var(--text-muted)",
              lineHeight: "1.6",
            }}>Explore trending cards and exclusive listings from verified collectors</p>
          </div>

          {/* Featured Card with Glassmorphism */}
          <div style={{
            maxWidth: "300px",
            margin: "0 auto",
            background: "var(--surface)",
            border: "2px solid var(--holo-silver)",
            borderRadius: "8px",
            overflow: "hidden",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }} onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.3)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--holo-silver)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}>
            <div style={{
              width: "100%",
              height: "280px",
              background: "linear-gradient(135deg, var(--surface-light), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
            }}>✦</div>
            <div style={{ padding: "20px", textAlign: "left" }}>
              <div style={{
                fontSize: "13px",
                color: "var(--accent)",
                fontWeight: "600",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>Charizard ex</div>
              <div style={{
                fontSize: "14px",
                color: "var(--text)",
                fontWeight: "700",
                marginBottom: "8px",
              }}>Scarlet & Violet #201</div>
              <div style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}>Grade 9 - Mint Condition</div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--accent)",
              }}>₱85,000</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}