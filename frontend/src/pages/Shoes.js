import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="nav-logo">PokeHub</Link>
    <ul className="nav-links">
      <li><Link to="/"      className="nav-link">Home</Link></li>
      <li><Link to="/item"  className="nav-link active">Shop</Link></li>
      <li><Link to="/add"   className="nav-link">Add Pack</Link></li>
      <li><Link to="/login" className="nav-link">Login</Link></li>
    </ul>
  </nav>
);

export default function Shoes() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8800/shoes")
      .then(res => { setPacks(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this pack?")) return;
    axios.delete(`http://localhost:8800/shoes/${id}`)
      .then(() => setPacks(prev => prev.filter(p => p.id !== id)))
      .catch(err => console.error(err));
  };

  const filtered = packs.filter(p =>
    p.prod_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.prod_description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="page" style={{ padding: "40px 60px", background: "var(--black)" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: "12px",
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--red)", marginBottom: "8px",
          }}>Collection</p>
          <h1 style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "64px", letterSpacing: "3px",
            color: "var(--yellow)", textShadow: "4px 4px 0 var(--red)",
            lineHeight: 1,
          }}>ALL PACKS</h1>
          <div className="divider" />
        </div>

        {/* Search + Add */}
        <div style={{
          display: "flex", gap: "16px",
          marginBottom: "40px", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <input
            type="text"
            placeholder="Search packs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: "var(--surface)", border: "2px solid var(--border)",
              color: "var(--text)", padding: "12px 20px",
              fontFamily: "'Barlow', sans-serif", fontSize: "15px",
              outline: "none", width: "320px",
            }}
            onFocus={e => e.target.style.borderColor = "var(--yellow)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <Link to="/add" className="btn btn-primary">+ Add New Pack</Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <div style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "32px", letterSpacing: "3px", color: "var(--yellow)",
            }}>Loading packs...</div>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "48px", color: "var(--text-muted)", letterSpacing: "2px",
            }}>No Packs Found</div>
            <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
              Try a different search or add a new pack.
            </p>
            <Link to="/add" className="btn btn-yellow" style={{ marginTop: "24px" }}>
              Add Your First Pack
            </Link>
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "2px",
        }}>
          {filtered.map(pack => (
            <div key={pack.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              {/* Image */}
              <div style={{
                width: "100%", height: "260px",
                overflow: "hidden",
                background: "var(--surface2)",
                position: "relative",
              }}>
                <img
                  src={pack.image || "https://placehold.co/300x260/1a1a1a/FFD700?text=No+Image"}
                  alt={pack.prod_name}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                  }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                  onError={e => { e.target.src = "https://placehold.co/300x260/1a1a1a/FFD700?text=No+Image"; }}
                />
                {/* Price badge */}
                <div style={{
                  position: "absolute", top: "12px", right: "0",
                  background: "var(--red)",
                  padding: "6px 16px 6px 12px",
                  fontFamily: "'Bangers', cursive",
                  fontSize: "22px", color: "white",
                  letterSpacing: "1px",
                  clipPath: "polygon(8px 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}>
                  ₱{parseFloat(pack.price).toFixed(2)}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <h2 style={{
                  fontFamily: "'Bangers', cursive",
                  fontSize: "24px", letterSpacing: "1.5px",
                  color: "var(--yellow)",
                }}>{pack.prod_name}</h2>
                <p style={{
                  fontSize: "13px", color: "var(--text-muted)",
                  lineHeight: 1.6, flex: 1,
                }}>{pack.prod_description || "No description provided."}</p>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    className="btn btn-yellow"
                    style={{ flex: 1, fontSize: "13px", padding: "10px" }}
                    onClick={() => navigate(`/update/${pack.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: "13px", padding: "10px" }}
                    onClick={() => handleDelete(pack.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}