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
      <div className="page" style={{ overflow: "hidden" }}>

        {/* ── HERO ── */}
        <section style={{
          minHeight: "calc(100vh - 100px)",
          display: "flex",
          alignItems: "center",
          position: "relative",
          padding: "0 64px",
          background: "var(--bg)",
          overflow: "hidden",
        }}>
          <div className="hero-bg-mesh" />
          <div className="hero-grid-lines" />

          {/* Floating card decorations */}
          <div style={{
            position: "absolute",
            right: "8%",
            top: "50%",
            transform: "translateY(-50%)",
            width: "380px",
            height: "520px",
            borderRadius: "20px",
            background: "linear-gradient(145deg, rgba(98,45,143,0.3), rgba(6,182,212,0.15))",
            border: "1px solid rgba(98,45,143,0.4)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(98,45,143,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "80px",
                marginBottom: "16px",
                filter: "drop-shadow(0 0 20px rgba(245,197,24,0.5))",
              }}>✦</div>
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "var(--holo-gold)",
              }}>Secret Rare</div>
              <div style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: "900",
                color: "white",
                marginTop: "8px",
              }}>Charizard ex</div>
              <div style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}>Scarlet & Violet — 201/165</div>
            </div>
          </div>

          {/* Small floating cards */}
          <div style={{
            position: "absolute",
            right: "5%",
            top: "20%",
            width: "160px",
            height: "220px",
            borderRadius: "12px",
            background: "linear-gradient(145deg, rgba(227,53,13,0.25), rgba(98,45,143,0.2))",
            border: "1px solid rgba(227,53,13,0.3)",
            transform: "rotate(12deg)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }} />

          <div style={{
            position: "absolute",
            right: "28%",
            bottom: "15%",
            width: "140px",
            height: "200px",
            borderRadius: "12px",
            background: "linear-gradient(145deg, rgba(6,182,212,0.2), rgba(98,45,143,0.15))",
            border: "1px solid rgba(6,182,212,0.25)",
            transform: "rotate(-8deg)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }} />

          {/* Hero content */}
          <div style={{ maxWidth: "600px", position: "relative", zIndex: 1 }}>
            <p className="kicker" style={{ marginBottom: "20px" }}>
              ◆ Premium TCG Marketplace
            </p>

            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(52px, 8vw, 90px)",
              fontWeight: "900",
              lineHeight: "0.95",
              letterSpacing: "-3px",
              color: "var(--text)",
              marginBottom: "28px",
            }}>
              Collect.<br />
              <span style={{
                background: "linear-gradient(135deg, var(--holo-gold), var(--masterball-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Invest.</span><br />
              Trade.
            </h1>

            <div className="divider" />

            <p style={{
              fontSize: "17px",
              color: "var(--text-muted)",
              lineHeight: "1.8",
              maxWidth: "480px",
              marginBottom: "44px",
              fontWeight: "300",
            }}>
              The definitive marketplace for Pokémon TCG collectors. From Base Set holographics
              to the latest Scarlet &amp; Violet expansions — every pull, every graded gem,
              every Secret Rare awaits.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/item" className="btn btn-primary" style={{ fontSize: "14px", padding: "16px 36px" }}>
                Browse Collection
              </Link>
              <Link to="/signup" className="btn btn-outline" style={{ fontSize: "14px", padding: "16px 36px" }}>
                Create Account →
              </Link>
            </div>

            {/* Stats row */}
            <div style={{
              display: "flex",
              gap: "40px",
              marginTop: "60px",
              paddingTop: "32px",
              borderTop: "1px solid var(--border)",
            }}>
              {[
                ["500+", "Packs Listed"],
                ["100+", "Card Sets"],
                ["PSA/BGS", "Grading"],
                ["24/7", "Support"],
              ].map(([num, label]) => (
                <div key={label} className="stat-block">
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{
          padding: "100px 64px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <p className="kicker" style={{ textAlign: "center", marginBottom: "12px" }}>
              Why TCG Vault
            </p>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: "900",
              letterSpacing: "-2px",
              color: "var(--text)",
              textAlign: "center",
              marginBottom: "60px",
            }}>
              Built for Collectors.<br />
              <span style={{ color: "var(--masterball-light)" }}>Trusted by Investors.</span>
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}>
              {[
                { icon: "✦", title: "Holo & Alt Art", desc: "Every card rendered with high-resolution scans. Hover to see the holofoil shimmer in action." },
                { icon: "📈", title: "Live Market Prices", desc: "Real-time price ticker tracks the Big Three and beyond. Know when to pull the trigger." },
                { icon: "🛡️", title: "100% Authentic", desc: "Every listing is verified against PSA and BGS population reports. No reprints, no fakes." },
                { icon: "⚡", title: "Same-Day Shipping", desc: "Cards ship same day in premium penny sleeves, top-loaders, and bubble mailers." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="feature-card">
                  <div className="feature-icon">{icon}</div>
                  <div className="feature-title">{title}</div>
                  <p className="feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{ padding: "80px 64px", background: "var(--bg)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="cta-banner" style={{ padding: "64px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <p className="kicker" style={{ color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>
                  Limited availability
                </p>
                <h2 style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  color: "white",
                  lineHeight: 1.1,
                }}>
                  Ready to Pull<br />a Secret Rare?
                </h2>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginTop: "12px" }}>
                  Join thousands of collectors building their dream vault.
                </p>
              </div>
              <Link to="/item" className="btn" style={{
                background: "var(--holo-gold)",
                color: "#1a0a00",
                fontSize: "14px",
                padding: "18px 44px",
                borderRadius: "12px",
                position: "relative",
                zIndex: 1,
                fontWeight: "800",
                letterSpacing: "1px",
                boxShadow: "0 8px 32px rgba(245,197,24,0.35)",
              }}>
                Shop Now →
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding: "32px 64px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontSize: "18px",
            fontWeight: "900",
            letterSpacing: "-0.5px",
            color: "var(--text)",
          }}>
            TCG<span style={{ color: "var(--masterball-light)" }}>Vault</span>
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
            © 2025 TCGVault. All rights reserved.
          </span>
        </footer>

      </div>
    </>
  );
}