import { Link } from "react-router-dom";

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="nav-logo">PokeHub</Link>
    <ul className="nav-links">
      <li><Link to="/"      className="nav-link active">Home</Link></li>
      <li><Link to="/item"  className="nav-link">Shop</Link></li>
      <li><Link to="/add"   className="nav-link">Add Pack</Link></li>
      <li><Link to="/login" className="nav-link">Login</Link></li>
    </ul>
  </nav>
);

export default function Main() {
  return (
    <>
      <Navbar />
      <div className="page" style={{ overflow: "hidden" }}>

        {/* ── HERO ── */}
        <section style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          position: "relative",
          padding: "0 60px",
          background: "var(--black)",
          overflow: "hidden",
        }}>
          {/* Background decoration */}
          <div style={{
            position: "absolute", right: "-100px", top: "50%",
            transform: "translateY(-50%)",
            width: "700px", height: "700px", borderRadius: "50%",
            border: "80px solid rgba(227,0,11,0.07)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: "80px", top: "50%",
            transform: "translateY(-50%)",
            width: "400px", height: "400px", borderRadius: "50%",
            border: "40px solid rgba(255,215,0,0.05)",
            pointerEvents: "none",
          }} />
          {/* Horizontal stripe */}
          <div style={{
            position: "absolute", left: 0, top: "50%",
            width: "100%", height: "6px",
            background: "linear-gradient(90deg, transparent 0%, rgba(227,0,11,0.3) 30%, rgba(255,215,0,0.3) 70%, transparent 100%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: "700px", position: "relative", zIndex: 1 }}>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: "13px",
              letterSpacing: "4px", textTransform: "uppercase",
              color: "var(--red)", marginBottom: "16px",
            }}>
              ⚡ The Ultimate Collection Store
            </p>

            <h1 style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "clamp(72px, 10vw, 120px)",
              lineHeight: 0.9,
              letterSpacing: "4px",
              color: "var(--yellow)",
              textShadow: "6px 6px 0 var(--red)",
              marginBottom: "24px",
            }}>
              CATCH<br />
              <span style={{ color: "white", textShadow: "6px 6px 0 var(--surface2)" }}>
                EVERY
              </span><br />
              PACK
            </h1>

            <div className="divider" style={{ width: "80px" }} />

            <p style={{
              fontSize: "18px", color: "#aaa",
              lineHeight: 1.7, maxWidth: "520px",
              marginBottom: "40px",
            }}>
              Score the hottest Pokémon card packs. From Base Set to the latest expansions — 
              every pull, every hype, every legendary card waiting to be yours.
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link to="/item" className="btn btn-primary" style={{ fontSize: "18px", padding: "14px 36px" }}>
                Browse Packs
              </Link>
              <Link to="/signup" className="btn btn-outline" style={{ fontSize: "18px", padding: "14px 36px" }}>
                Join Now
              </Link>
            </div>

            {/* Stats bar */}
            <div style={{
              display: "flex", gap: "40px",
              marginTop: "64px", paddingTop: "32px",
              borderTop: "1px solid var(--border)",
            }}>
              {[["500+","Packs"], ["100+","Sets"], ["24/7","Support"]].map(([num, label]) => (
                <div key={label}>
                  <div style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: "36px", color: "var(--yellow)",
                  }}>{num}</div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "12px", letterSpacing: "2px",
                    textTransform: "uppercase", color: "var(--text-muted)",
                  }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{
          padding: "100px 60px",
          background: "var(--surface)",
          borderTop: "4px solid var(--red)",
        }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: "12px",
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--red)", marginBottom: "8px",
          }}>Why PokeHub</p>
          <h2 style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "56px", letterSpacing: "3px",
            color: "white", marginBottom: "60px",
          }}>THE HUB FOR COLLECTORS</h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "2px",
          }}>
            {[
              { icon: "⚡", title: "Fresh Drops", desc: "New packs added weekly from the latest Pokémon expansions worldwide." },
              { icon: "🔥", title: "Rare Finds", desc: "Hunt down ultra-rare cards and sealed vintage sets you won't find anywhere else." },
              { icon: "🛡️", title: "100% Authentic", desc: "Every pack is verified authentic. No fakes, no reprints, ever." },
              { icon: "🚀", title: "Fast Shipping", desc: "Orders ship same day. Your packs arrive safe, sealed, and ready to rip." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "var(--black)",
                padding: "40px 32px",
                borderLeft: "3px solid var(--border)",
                transition: "border-color 0.2s",
                cursor: "default",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--yellow)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{icon}</div>
                <div style={{
                  fontFamily: "'Bangers', cursive",
                  fontSize: "24px", letterSpacing: "2px",
                  color: "var(--yellow)", marginBottom: "12px",
                }}>{title}</div>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{
          padding: "80px 60px",
          background: "var(--red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px",
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "52px", letterSpacing: "3px",
              color: "var(--yellow)", textShadow: "3px 3px 0 rgba(0,0,0,0.3)",
            }}>READY TO PULL A SECRET RARE?</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)" }}>
              Join thousands of collectors on PokeHub today.
            </p>
          </div>
          <Link to="/item" className="btn" style={{
            background: "var(--yellow)", color: "var(--black)",
            fontSize: "20px", padding: "16px 48px",
            fontFamily: "'Bangers', cursive", letterSpacing: "2px",
            clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
          }}>
            Shop Now →
          </Link>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding: "32px 60px",
          background: "var(--black)",
          borderTop: "2px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <span style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "24px", color: "var(--yellow)",
            textShadow: "2px 2px 0 var(--red)",
          }}>PokeHub</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            © 2025 PokeHub. All rights reserved.
          </span>
        </footer>

      </div>
    </>
  );
}