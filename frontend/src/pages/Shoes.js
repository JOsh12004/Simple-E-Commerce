import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { clearAuthUser, getAuthHeaders, getAuthUser, isAdminUser } from "../utils/auth";

const PRICE_DATA = [
  { name: "Charizard Base 1st Ed.", price: "₱85,000", change: "+12.4%", up: true },
  { name: "Blastoise Holo", price: "₱42,500", change: "+5.1%", up: true },
  { name: "Venusaur 1st Ed.", price: "₱38,200", change: "-1.8%", up: false },
  { name: "Pikachu Illustrator", price: "₱920,000", change: "+31.2%", up: true },
  { name: "Lugia Neo Genesis", price: "₱18,700", change: "+8.6%", up: true },
  { name: "Mewtwo Base Set", price: "₱12,400", change: "-0.5%", up: false },
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
      <div className="ticker-track">
        <TickerItems /><TickerItems />
      </div>
    </div>
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        TCG<span style={{ color: "var(--masterball-light)" }}>Vault</span>
      </Link>
      <ul className="nav-links">
        <li><Link to="/" className="nav-link">Home</Link></li>
        <li><Link to="/item" className="nav-link active">Collection</Link></li>
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

// The holofoil card component
function PackCard({ pack, onEdit, onDelete, isAdmin }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mouse-x", `${x}%`);
    card.style.setProperty("--mouse-y", `${y}%`);

    // 3D tilt
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((e.clientY - rect.top - cy) / cy) * -7;
    const rotateY = ((e.clientX - rect.left - cx) / cx) * 7;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    card.style.transition = "transform 0.4s ease, border-color 0.3s, box-shadow 0.3s";
  };

  const handleMouseEnter = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 0.1s ease, border-color 0.3s, box-shadow 0.3s";
  };

  // Assign rarity based on price
  const price = parseFloat(pack.price) || 0;
  let rarityLabel = "Common";
  let rarityClass = "";
  if (price >= 10000) { rarityLabel = "Secret Rare"; rarityClass = "rarity-secret"; }
  else if (price >= 5000) { rarityLabel = "Ultra Rare"; rarityClass = "rarity-ultra"; }
  else if (price >= 1000) { rarityLabel = "Rare Holo"; rarityClass = "rarity-rare"; }

  return (
    <div
      ref={cardRef}
      className="pack-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Holo overlays */}
      <div className="holo-overlay" />
      <div className="holo-shine" />

      {/* Card image */}
      <div style={{
        width: "100%",
        height: "260px",
        overflow: "hidden",
        background: "linear-gradient(145deg, var(--surface2), var(--surface3))",
        position: "relative",
        flexShrink: 0,
      }}>
        <img
          src={pack.image || "https://placehold.co/300x260/1F2937/622D8F?text=TCG+Pack"}
          alt={pack.prod_name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease",
          }}
          onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
          onMouseLeave={e => e.target.style.transform = "scale(1)"}
          onError={e => { e.target.src = "https://placehold.co/300x260/1F2937/622D8F?text=TCG"; }}
        />

        {/* Rarity badge */}
        {rarityLabel !== "Common" && (
          <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 3 }}>
            <span className={`rarity-badge ${rarityClass}`}>
              {rarityLabel === "Secret Rare" ? "✦" : "◆"} {rarityLabel}
            </span>
          </div>
        )}

        {/* Price badge */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "32px 16px 14px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          zIndex: 3,
        }}>
          <div className="price-badge">
            <small>₱</small>
            {parseFloat(pack.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Card info */}
      <div style={{
        padding: "20px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
        zIndex: 3,
      }}>
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "16px",
          fontWeight: "800",
          letterSpacing: "-0.3px",
          color: "var(--text)",
          lineHeight: 1.3,
        }}>
          {pack.prod_name}
        </h2>

        {pack.prod_description && (
          <p style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: "1.6",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {pack.prod_description}
          </p>
        )}

        {/* Actions */}
        {isAdmin ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: "12px", padding: "10px" }}
              onClick={() => onEdit(pack.id)}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1, fontSize: "12px", padding: "10px" }}
              onClick={() => onDelete(pack.id)}
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", fontSize: "12px", padding: "10px", marginTop: "4px" }}
          >
            Buy Now
          </button>
        )}
      </div>
    </div>
  );
}

export default function Shoes() {
  const [packs, setPacks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
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
    axios.get("http://localhost:8800/shoes")
      .then(res => { setPacks(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    if (!isAdmin) {
      return;
    }

    if (!window.confirm("Remove this pack from the vault?")) return;
    axios.delete(`http://localhost:8800/shoes/${id}`, { headers: getAuthHeaders() })
      .then(() => setPacks(prev => prev.filter(p => p.id !== id)))
      .catch(err => console.error(err));
  };

  const filtered = packs.filter(p =>
    p.prod_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.prod_description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="page" style={{ padding: "40px 64px 80px", background: "var(--bg)", minHeight: "100vh" }}>

        {/* Page header */}
        <div style={{ marginBottom: "48px" }}>
          <p className="kicker" style={{ marginBottom: "10px" }}>The Vault</p>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: "900",
            letterSpacing: "-3px",
            color: "var(--text)",
            lineHeight: 0.95,
          }}>
            All<br />
            <span style={{
              background: "linear-gradient(135deg, var(--holo-gold), var(--masterball-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Packs
            </span>
          </h1>
          <div className="divider" style={{ marginTop: "16px" }} />
        </div>

        {/* Search + Add */}
        <div style={{
          display: "flex",
          gap: "16px",
          marginBottom: "48px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search packs, sets, cards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Link to="/add" className="btn btn-purple" style={{ padding: "12px 28px" }}>
              + Add New Pack
            </Link>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="loading-text">Loading vault contents...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>◇</div>
            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--text-muted)",
              letterSpacing: "-0.5px",
            }}>
              No Packs Found
            </h3>
            <p style={{ color: "var(--text-dim)", marginTop: "10px", fontSize: "14px" }}>
              Try a different search{isAdmin ? " or add your first pack." : "."}
            </p>
            {isAdmin && (
              <Link to="/add" className="btn btn-purple" style={{ marginTop: "28px" }}>
                Add Your First Pack
              </Link>
            )}
          </div>
        )}

        {/* Pack grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}>
            {filtered.map(pack => (
              <PackCard
                key={pack.id}
                pack={pack}
                isAdmin={isAdmin}
                onEdit={(id) => navigate(`/update/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}