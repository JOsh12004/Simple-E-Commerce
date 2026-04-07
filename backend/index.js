import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json()); // Parses incoming JSON payloads
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "change-this-jwt-secret";

const normalizeRole = (rawRole) => {
    const role = (rawRole || "").toString().trim().toLowerCase();
    return role === "admin" ? "admin" : "user";
};

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.auth = payload;
        return next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.auth?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can perform this action." });
    }
    return next();
};

// ─── Database Connection ───────────────────────────────────────────────────────

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",           // XAMPP default is empty — change if you set a password
    database: "marketplace",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
    console.log("Connected to the database.");
});

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
    res.json("Hello, this is the backend!");
});

// ─── AUTH Routes ───────────────────────────────────────────────────────────────

// POST /login
app.post("/login", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const q = "SELECT * FROM users WHERE LOWER(TRIM(email)) = ?";
    db.query(q, [email], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        if (data.length === 0) return res.status(404).json({ error: "Email not found." });

        const user = data[0];
        if ((user.password ?? "").trim() !== password) {
            return res.status(404).json({ error: "Password does not match." });
        }

        const userId = user.id ?? user.user_id;
        const role = normalizeRole(user.role);
        const userResponse = {
            id: userId,
            name: user.name,
            email: user.email,
            role,
        };

        // Role is signed in JWT so it cannot be forged by the client.
        const token = jwt.sign(
            { id: userId, email: user.email, role },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(200).json({ message: "Login successful!", user: userResponse, token });
    });
});

// POST /signup
app.post("/signup", (req, res) => {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    // New signups default to normal user so only existing admins can manage inventory.
    const q = "INSERT INTO users (name, email, password, role) VALUES (?)";
    const values = [name, email, password, "user"];
    db.query(q, [values], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(201).json({ message: "User created successfully!" });
    });
});

// ─── SHOES Routes ──────────────────────────────────────────────────────────────

// GET /shoes — Read all shoes
app.get("/shoes", (req, res) => {
    const q = "SELECT * FROM shoes";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(200).json(data);
    });
});

// GET /shoes/:id — Read single shoe
app.get("/shoes/:id", (req, res) => {
    const shoeId = req.params.id;
    const q = "SELECT * FROM shoes WHERE id = ?";
    db.query(q, [shoeId], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        if (data.length === 0) return res.status(404).json({ error: "Shoe not found" });
        return res.status(200).json(data[0]);
    });
});

// POST /shoes — Create a shoe
app.post("/shoes", requireAuth, requireAdmin, (req, res) => {
    const q = "INSERT INTO shoes (`prod_name`, `prod_description`, `image`, `price`) VALUES (?)";
    const values = [
        req.body.prod_name,
        req.body.prod_description,
        req.body.image,
        req.body.price,
    ];
    db.query(q, [values], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(201).json({ message: "Shoe added successfully!", id: data.insertId });
    });
});

// PUT /shoes/:id — Update a shoe
app.put("/shoes/:id", requireAuth, requireAdmin, (req, res) => {
    const shoeId = req.params.id;
    const q = "UPDATE shoes SET `prod_name`=?, `prod_description`=?, `image`=?, `price`=? WHERE id=?";
    const values = [
        req.body.prod_name,
        req.body.prod_description,
        req.body.image,
        req.body.price,
    ];
    db.query(q, [...values, shoeId], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(200).json({ message: "Shoe updated successfully!" });
    });
});

// DELETE /shoes/:id — Delete a shoe
app.delete("/shoes/:id", requireAuth, requireAdmin, (req, res) => {
    const shoeId = req.params.id;
    const q = "DELETE FROM shoes WHERE id = ?";
    db.query(q, [shoeId], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(200).json({ message: "Shoe deleted successfully!" });
    });
});

// ─── Start Server ──────────────────────────────────────────────────────────────

app.listen(8800, () => {
    console.log("Backend running on http://localhost:8800");
});