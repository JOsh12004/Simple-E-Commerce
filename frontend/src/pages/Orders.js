import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { clearAuthUser, getAuthHeaders, getAuthUser, isAdminUser } from "../utils/auth";

const ORDER_STATUSES = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

const PRICE_DATA = [
  { name: "Charizard Base 1st Ed.", price: "PHP 85,000", change: "+12.4%", up: true },
  { name: "Blastoise Holo", price: "PHP 42,500", change: "+5.1%", up: true },
  { name: "Lugia Neo Genesis", price: "PHP 18,700", change: "+8.6%", up: true },
  { name: "Mewtwo Base Set", price: "PHP 12,400", change: "-0.5%", up: false },
];

const TickerItems = () =>
  PRICE_DATA.map((item, i) => (
    <span key={i} className="ticker-item">
      <span className="ticker-name">{item.name}</span>
      <span className="ticker-price">{item.price}</span>
      <span className={item.up ? "ticker-up" : "ticker-down"}>
        {item.up ? "UP" : "DOWN"} {item.change}
      </span>
      <span className="ticker-sep">|</span>
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
        <li><Link to="/" className="nav-link">Home</Link></li>
        <li><Link to="/item" className="nav-link">Collection</Link></li>
        <li><Link to="/orders" className="nav-link active">Orders</Link></li>
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

const defaultItem = { productID: "", quantity: "1" };

export default function Orders() {
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const [shoes, setShoes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([defaultItem]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = isAdminUser();
  const isLoggedIn = Boolean(authUser);

  const productPriceMap = useMemo(
    () => new Map(shoes.map((shoe) => [Number(shoe.id), Number(shoe.price) || 0])),
    [shoes]
  );

  const handleLogout = () => {
    clearAuthUser();
    setAuthUser(null);
    navigate("/login");
  };

  const fetchOrders = async () => {
    const response = await axios.get("http://localhost:8800/orders", {
      headers: getAuthHeaders(),
    });

    const fetchedOrders = response.data?.data || [];
    setOrders(fetchedOrders);

    const nextEditing = {};
    fetchedOrders.forEach((order) => {
      nextEditing[order.orderID] = {
        status: order.status || "Pending",
      };
    });
    setEditing(nextEditing);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [shoeResponse] = await Promise.all([
          axios.get("http://localhost:8800/shoes"),
          fetchOrders(),
        ]);
        setShoes(shoeResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load order data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const productID = Number(searchParams.get("productID"));
    if (!Number.isInteger(productID) || productID <= 0) {
      return;
    }

    setItems([{ productID: String(productID), quantity: "1" }]);
  }, [searchParams]);

  const computedTotal = useMemo(() => {
    const value = items.reduce((sum, item) => {
      const productID = Number(item.productID);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(productID) || !Number.isInteger(quantity) || quantity < 1) {
        return sum;
      }
      return sum + (productPriceMap.get(productID) || 0) * quantity;
    }, 0);

    return Number(value.toFixed(2));
  }, [items, productPriceMap]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, defaultItem]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normalizedItems = items
      .map((item) => ({
        productID: Number(item.productID),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isInteger(item.productID) && Number.isInteger(item.quantity) && item.quantity >= 1);

    if (normalizedItems.length === 0) {
      setError("Please add at least one valid item.");
      return;
    }

    if (shippingAddress.trim().length < 10) {
      setError("Shipping address must be at least 10 characters.");
      return;
    }

    if (computedTotal <= 0) {
      setError("Total amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        "http://localhost:8800/orders",
        {
          userID: Number(authUser?.id),
          status: "Pending",
          items: normalizedItems,
          totalAmount: computedTotal,
          shippingAddress: shippingAddress.trim(),
        },
        { headers: getAuthHeaders() }
      );

      setSuccess("Order placed successfully.");
      setShippingAddress("");
      setItems([defaultItem]);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderID) => {
    const selectedStatus = editing[orderID]?.status;
    if (!selectedStatus) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:8800/orders/${orderID}`,
        { status: selectedStatus },
        { headers: getAuthHeaders() }
      );
      await fetchOrders();
      setSuccess(`Order #${orderID} updated.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order.");
    }
  };

  const deleteOrder = async (orderID) => {
    if (!window.confirm("Delete this order?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8800/orders/${orderID}`, {
        headers: getAuthHeaders(),
      });
      await fetchOrders();
      setSuccess(`Order #${orderID} deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete order.");
    }
  };

  return (
    <>
      <Navbar isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="page" style={{ padding: "40px 64px 80px", background: "var(--bg)", minHeight: "100vh" }}>
        <div style={{ marginBottom: "30px" }}>
          <p className="kicker" style={{ marginBottom: "10px" }}>Order Module</p>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(34px, 6vw, 58px)",
            fontWeight: "900",
            letterSpacing: "-2px",
            color: "var(--text)",
            lineHeight: 1,
          }}>
            Place and Manage Orders
          </h1>
          <div className="divider" style={{ marginTop: "16px" }} />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "18px" }}>
            <span>!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: "18px" }}>
            <span>OK</span>
            <span>{success}</span>
          </div>
        )}

        <div className="orders-grid">
          {!isAdmin && (
            <section className="orders-panel">
              <h2 className="orders-title">Create Order</h2>
              <form onSubmit={createOrder} className="orders-form">
                <div className="rarity-badge rarity-rare" style={{ width: "fit-content" }}>
                  Initial Status: Pending
                </div>

                <div className="form-group">
                  <label>Shipping Address</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Street, City, Province, Zip"
                  />
                </div>

                <div className="orders-items-wrap">
                  {items.map((item, index) => (
                    <div key={`item-${index}`} className="orders-item-row">
                      <select
                        className="search-input orders-input"
                        value={item.productID}
                        onChange={(e) => handleItemChange(index, "productID", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {shoes.map((shoe) => (
                          <option key={shoe.id} value={shoe.id}>
                            {shoe.prod_name || shoe.title} (PHP {Number(shoe.price || 0).toFixed(2)})
                          </option>
                        ))}
                      </select>

                      <input
                        className="search-input orders-input"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        placeholder="Qty"
                      />

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost" onClick={handleAddItem}>+ Add Item</button>
                  <div className="orders-total">Total: PHP {computedTotal.toFixed(2)}</div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Place Order"}
                </button>
              </form>
            </section>
          )}

          <section className="orders-panel">
            <h2 className="orders-title">Order List</h2>

            {loading && <div className="loading-state"><div className="loading-text">Loading orders...</div></div>}

            {!loading && orders.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No orders found yet.</p>
            )}

            {!loading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => (
                  <article key={order.orderID} className="order-card">
                    <div className="order-card-top">
                      <div>
                        <div className="order-id">Order #{order.orderID}</div>
                        <div className="order-meta">
                          User: {order.userID} | Date: {new Date(order.orderDate).toLocaleString()}
                        </div>
                      </div>
                      <div className="orders-total">PHP {Number(order.totalAmount || 0).toFixed(2)}</div>
                    </div>

                    <div className="order-meta" style={{ marginTop: "8px" }}>
                      Shipping: {order.shippingAddress}
                    </div>

                    <ul className="order-items-list">
                      {(order.items || []).map((item, idx) => (
                        <li key={`${order.orderID}-item-${idx}`}>
                          Product #{item.productID} x {item.quantity} @ PHP {Number(item.unitPrice || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>

                    <div className="order-actions">
                      {isAdmin ? (
                        <>
                          <select
                            className="search-input orders-input"
                            value={editing[order.orderID]?.status || order.status}
                            onChange={(e) =>
                              setEditing((prev) => ({
                                ...prev,
                                [order.orderID]: {
                                  ...prev[order.orderID],
                                  status: e.target.value,
                                },
                              }))
                            }
                          >
                            {ORDER_STATUSES.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>

                          <button className="btn btn-ghost" onClick={() => updateOrderStatus(order.orderID)}>
                            Update Status
                          </button>

                          <button className="btn btn-danger" onClick={() => deleteOrder(order.orderID)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="rarity-badge rarity-rare">Status: {order.status}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
