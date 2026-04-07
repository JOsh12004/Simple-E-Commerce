import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(express.json()); // Parses incoming JSON payloads
app.use(cors());

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
    const { email, password } = req.body;
    const q = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(q, [email, password], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        if (data.length === 0) return res.status(404).json({ error: "Invalid credentials!" });
        return res.status(200).json({ message: "Login successful!", user: data[0] });
    });
});

// POST /signup
app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;
    const q = "INSERT INTO users (name, email, password) VALUES (?)";
    const values = [name, email, password];
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
app.post("/shoes", (req, res) => {
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
app.put("/shoes/:id", (req, res) => {
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
app.delete("/shoes/:id", (req, res) => {
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