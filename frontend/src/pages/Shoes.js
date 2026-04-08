import { useEffect, useState } from "react";
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

// Simplified card component for new minimalist design
function PackCard({ pack, onEdit, onDelete, onBuy, isAdmin, isLoggedIn }) {
  const imageSrc = (Array.isArray(pack.images) && pack.images[0]) || pack.image;

  // Assign rarity based on price
  const price = parseFloat(pack.price) || 0;
  let rarityLabel = "Common";
  if (price >= 10000) rarityLabel = "Secret Rare";
  else if (price >= 5000) rarityLabel = "Ultra Rare";
  else if (price >= 1000) rarityLabel = "Rare Holo";

  return (
    <div className="pack-card">
      {/* Card image */}
      <img
        src={imageSrc || "https://placehold.co/240x280/1a2f4d/6366f1?text=TCG"}
        alt={pack.prod_name}
        className="pack-card-image"
        onError={e => { e.target.src = "https://placehold.co/240x280/1a2f4d/6366f1?text=Card"; }}
      />

      {/* Card body */}
      <div className="pack-card-body">
        <div className="pack-card-title">{pack.prod_name}</div>
        <div className="pack-card-description">{pack.description || rarityLabel}</div>

        {/* Card footer */}
        <div className="pack-card-footer">
          <div className="pack-card-price">
            ₱{parseFloat(pack.price).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </div>
          <div className="pack-card-actions">
            {isAdmin && (
              <>
                <button className="btn btn-secondary" onClick={() => onEdit(pack)} title="Edit">✎</button>
                <button className="btn btn-danger" onClick={() => onDelete(pack)} title="Delete">×</button>
              </>
            )}
            {!isAdmin && (
              <button className="btn btn-primary" onClick={() => onBuy(pack)}>
                {isLoggedIn ? "Buy" : "View"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shoes() {
  const [packs, setPacks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [lowStock, setLowStock] = useState([]);
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

  useEffect(() => {
    if (!isAdmin) {
      setLowStock([]);
      return;
    }

    axios.get("http://localhost:8800/shoes/low-stock", { headers: getAuthHeaders() })
      .then(res => setLowStock(res.data?.items || []))
      .catch(() => setLowStock([]));
  }, [isAdmin]);

  const handleDelete = (id) => {
    if (!isAdmin) {
      return;
    }

    if (!window.confirm("Remove this pack from the vault?")) return;
    axios.delete(`http://localhost:8800/shoes/${id}`, { headers: getAuthHeaders() })
      .then(() => setPacks(prev => prev.filter(p => p.id !== id)))
      .catch(err => console.error(err));
  };

  const handleBuyNow = (pack) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    navigate(`/orders?productID=${pack.id}`);
  };

  const categories = Array.from(new Set(
    packs
      .map((p) => p.category)
      .filter((value) => typeof value === "string" && value.trim())
  ));

  const filtered = packs.filter((p) => {
    const keyword = search.trim().toLowerCase();
    const name = (p.prod_name || p.title || "").toLowerCase();
    const description = (p.prod_description || p.description || "").toLowerCase();
    const price = Number(p.price) || 0;
    const rating = Number(p.rating) || 0;
    const category = (p.category || "").toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    const matchesKeyword = !keyword || name.includes(keyword) || description.includes(keyword);
    const matchesMinPrice = min === null || (!Number.isNaN(min) && price >= min);
    const matchesMaxPrice = max === null || (!Number.isNaN(max) && price <= max);
    const matchesCategory = categoryFilter === "all" || category === categoryFilter.toLowerCase();
    const matchesRating = rating >= Number(minRating || 0);

    return matchesKeyword && matchesMinPrice && matchesMaxPrice && matchesCategory && matchesRating;
  });

  return (
    <>
      <Navbar isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="page">

        {/* Page header */}
        <div className="page-header">
          <div className="page-title">Collection</div>
          <div className="page-subtitle">Explore our premium Pokémon trading card collection</div>
        </div>

        {/* Filters & Search */}
        <div style={{ padding: "32px 48px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search cards, sets, grades..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
          </div>

          {/* Advanced filters */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}>
            <input
              type="number"
              className="search-input"
              placeholder="Min Price"
              value={minPrice}
              min="0"
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              className="search-input"
              placeholder="Max Price"
              value={maxPrice}
              min="0"
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select
              className="search-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              className="search-input"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="0">Any Rating</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
            {isAdmin && (
              <Link to="/add" className="btn btn-primary" style={{ justifyContent: "center" }}>
                + Add Pack
              </Link>
            )}
          </div>

          {isAdmin && lowStock.length > 0 && (
            <div className="alert alert-error" style={{ marginTop: "16px" }}>
              <span>⚠</span>
              <span>{lowStock.length} product(s) are low on stock (5 or fewer left).</span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="cards-grid">
          {loading && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.5 }}>⟳</div>
              <div style={{ color: "var(--text-muted)" }}>Loading collection...</div>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>◇</div>
              <div style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}>No Packs Found</div>
              <div style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "20px" }}>
                Try adjusting your filters
              </div>
              {isAdmin && (
                <Link to="/add" className="btn btn-primary">
                  Add Pack
                </Link>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            filtered.map(pack => (
              <PackCard
                key={pack.id}
                pack={pack}
                isAdmin={isAdmin}
                isLoggedIn={isLoggedIn}
                onEdit={(id) => navigate(`/update/${id}`)}
                onDelete={handleDelete}
                onBuy={handleBuyNow}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}