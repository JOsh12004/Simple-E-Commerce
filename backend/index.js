import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json()); // Parses incoming JSON payloads
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "change-this-jwt-secret";

const LOW_STOCK_THRESHOLD = 5;
const ORDER_STATUSES = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

const dbQuery = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });

const isValidUrl = (value) => {
    try {
        const parsed = new URL(value);
        return ["http:", "https:"].includes(parsed.protocol);
    } catch {
        return false;
    }
};

const parseStoredImages = (row) => {
    if (row?.images_json) {
        try {
            const parsed = JSON.parse(row.images_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter((img) => typeof img === "string" && img.trim());
            }
        } catch {
            // Fallback to single image field if legacy data cannot be parsed.
        }
    }

    if (typeof row?.image === "string" && row.image.trim()) {
        return [row.image.trim()];
    }

    return [];
};

const normalizeImagesInput = (images, image) => {
    if (Array.isArray(images)) {
        return images
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean);
    }

    if (typeof images === "string" && images.trim()) {
        return images
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (typeof image === "string" && image.trim()) {
        return [image.trim()];
    }

    return [];
};

const buildProductResponse = (row) => {
    const images = parseStoredImages(row);

    return {
        ...row,
        productID: row.id,
        title: row.prod_name,
        description: row.prod_description,
        images,
        quantity: Number.isFinite(Number(row.quantity)) ? Number(row.quantity) : 0,
        rating: Number.isFinite(Number(row.rating)) ? Number(row.rating) : null,
        image: images[0] || "",
    };
};

const validateProductPayload = (body) => {
    const title = (body.title ?? body.prod_name ?? "").toString().trim();
    const description = (body.description ?? body.prod_description ?? "").toString().trim();
    const priceValue = Number(body.price);
    const images = normalizeImagesInput(body.images, body.image);
    const quantityProvided = body.quantity !== undefined && body.quantity !== null && body.quantity !== "";
    const categoryRaw = body.category ?? "";
    const category = categoryRaw === null ? "" : categoryRaw.toString().trim();
    const ratingProvided = body.rating !== undefined && body.rating !== null && body.rating !== "";
    const ratingValue = Number(body.rating);
    const errors = [];

    const pushError = (field, message) => {
        errors.push({ field, message });
    };

    if (title.length < 3 || title.length > 120) {
        pushError("prod_name", "Title must be between 3 and 120 characters.");
    }

    if (description.length < 10 || description.length > 2000) {
        pushError("prod_description", "Description must be between 10 and 2000 characters.");
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
        pushError("price", "Price must be a numeric value greater than 0.");
    }

    if (images.length < 1) {
        pushError("images", "At least one image URL is required.");
    }

    if (images.some((img) => !isValidUrl(img))) {
        pushError("images", "All images must be valid http/https URLs.");
    }

    if (quantityProvided) {
        const quantityValue = Number(body.quantity);
        if (!Number.isInteger(quantityValue) || quantityValue < 0) {
            pushError("quantity", "Quantity must be an integer value of 0 or higher.");
        }
    }

    if (ratingProvided && (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5)) {
        pushError("rating", "Rating must be a number from 1 to 5 when provided.");
    }

    return {
        errors,
        values: {
            prod_name: title,
            prod_description: description,
            image: images[0],
            images_json: JSON.stringify(images),
            price: priceValue,
            quantity: quantityProvided ? Number(body.quantity) : 0,
            category: category || null,
            rating: ratingProvided ? ratingValue : null,
        },
    };
};

const ensureShoesColumn = async (columnName, definition) => {
    const existing = await dbQuery("SHOW COLUMNS FROM shoes LIKE ?", [columnName]);
    if (existing.length === 0) {
        await dbQuery(`ALTER TABLE shoes ADD COLUMN ${columnName} ${definition}`);
    }
};

const ensureShoesSchema = async () => {
    // Keep legacy table name but add fields required by Product module requirements.
    await ensureShoesColumn("images_json", "TEXT NULL");
    await ensureShoesColumn("quantity", "INT NOT NULL DEFAULT 0");
    await ensureShoesColumn("category", "VARCHAR(120) NULL");
    await ensureShoesColumn("rating", "DECIMAL(2,1) NULL");
};

const ensureOrdersSchema = async () => {
    // Orders and order items are created lazily so existing environments keep working.
    await dbQuery(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status ENUM('Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
            total_amount DECIMAL(10,2) NOT NULL,
            shipping_address VARCHAR(255) NOT NULL,
            INDEX idx_orders_user_id (user_id),
            INDEX idx_orders_status (status),
            CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await dbQuery(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            INDEX idx_order_items_order_id (order_id),
            INDEX idx_order_items_product_id (product_id),
            CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES shoes(id) ON DELETE RESTRICT
        )
    `);
};

const parseOrderItems = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => {
            const productID = Number(item?.productID);
            const quantity = Number(item?.quantity);
            return {
                productID,
                quantity,
            };
        })
        .filter((item) => Number.isInteger(item.productID) && Number.isInteger(item.quantity));
};

const validateOrderPayload = (body, options = { partial: false }) => {
    const partial = Boolean(options.partial);
    const rawStatus = (body.status ?? "").toString().trim();
    const status = rawStatus || "Pending";
    const itemsProvided = body.items !== undefined;
    const items = parseOrderItems(body.items);
    const totalAmount = Number(body.totalAmount);
    const shippingAddress = (body.shippingAddress ?? "").toString().trim();
    const userID = Number(body.userID);
    const errors = [];

    const pushError = (field, message) => {
        errors.push({ field, message });
    };

    if (!partial || body.userID !== undefined) {
        if (!Number.isInteger(userID) || userID <= 0) {
            pushError("userID", "userID must be a valid positive integer.");
        }
    }

    if (!partial || body.status !== undefined) {
        if (!ORDER_STATUSES.includes(status)) {
            pushError("status", `status must be one of: ${ORDER_STATUSES.join(", ")}.`);
        }
    }

    if (!partial || itemsProvided) {
        if (!Array.isArray(body.items) || items.length === 0) {
            pushError("items", "items must include at least one product with quantity.");
        }

        if (items.some((item) => item.quantity < 1)) {
            pushError("items", "Each item quantity must be at least 1.");
        }
    }

    if (!partial || body.totalAmount !== undefined) {
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            pushError("totalAmount", "totalAmount must be a numeric value greater than 0.");
        }
    }

    if (!partial || body.shippingAddress !== undefined) {
        if (shippingAddress.length < 10 || shippingAddress.length > 255) {
            pushError("shippingAddress", "shippingAddress must be between 10 and 255 characters.");
        }
    }

    return {
        errors,
        values: {
            userID,
            status,
            items,
            totalAmount,
            shippingAddress,
        },
    };
};

const getOrderItems = async (orderId) => {
    const rows = await dbQuery(
        `SELECT oi.product_id, oi.quantity, oi.unit_price, s.prod_name
         FROM order_items oi
         LEFT JOIN shoes s ON s.id = oi.product_id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [orderId]
    );

    return rows.map((item) => ({
        productID: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        title: item.prod_name || null,
    }));
};

const buildOrderResponse = (orderRow, items = []) => ({
    orderID: orderRow.id,
    userID: orderRow.user_id,
    orderDate: orderRow.order_date,
    status: orderRow.status,
    items,
    totalAmount: Number(orderRow.total_amount),
    shippingAddress: orderRow.shipping_address,
});

const userExists = async (userId) => {
    const rows = await dbQuery("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
    return rows.length > 0;
};

const getProductsByIds = async (productIds) => {
    if (productIds.length === 0) {
        return [];
    }

    const placeholders = productIds.map(() => "?").join(",");
    return dbQuery(`SELECT id, price FROM shoes WHERE id IN (${placeholders})`, productIds);
};

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

    ensureShoesSchema()
        .then(() => {
            return ensureOrdersSchema();
        })
        .then(() => {
            console.log("Connected to the database.");
        })
        .catch((schemaErr) => {
            console.error("Schema initialization error:", schemaErr);
            process.exit(1);
        });
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
    const {
        search,
        minPrice,
        maxPrice,
        category,
        minRating,
    } = req.query;

    const where = [];
    const values = [];

    if (typeof search === "string" && search.trim()) {
        where.push("(LOWER(prod_name) LIKE ? OR LOWER(prod_description) LIKE ?)");
        const term = `%${search.trim().toLowerCase()}%`;
        values.push(term, term);
    }

    if (minPrice !== undefined && minPrice !== "") {
        const parsed = Number(minPrice);
        if (Number.isFinite(parsed)) {
            where.push("price >= ?");
            values.push(parsed);
        }
    }

    if (maxPrice !== undefined && maxPrice !== "") {
        const parsed = Number(maxPrice);
        if (Number.isFinite(parsed)) {
            where.push("price <= ?");
            values.push(parsed);
        }
    }

    if (typeof category === "string" && category.trim()) {
        where.push("LOWER(category) = ?");
        values.push(category.trim().toLowerCase());
    }

    if (minRating !== undefined && minRating !== "") {
        const parsed = Number(minRating);
        if (Number.isFinite(parsed)) {
            where.push("COALESCE(rating, 0) >= ?");
            values.push(parsed);
        }
    }

    const q = `SELECT * FROM shoes${where.length > 0 ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC`;

    db.query(q, values, (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(200).json(data.map(buildProductResponse));
    });
});

// GET /shoes/low-stock — Admin stock warning list
app.get("/shoes/low-stock", requireAuth, requireAdmin, (req, res) => {
    const threshold = Number(req.query.threshold);
    const safeThreshold = Number.isInteger(threshold) && threshold >= 0 ? threshold : LOW_STOCK_THRESHOLD;
    const q = "SELECT * FROM shoes WHERE quantity <= ? ORDER BY quantity ASC, id DESC";

    db.query(q, [safeThreshold], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(200).json({
            threshold: safeThreshold,
            count: data.length,
            items: data.map(buildProductResponse),
        });
    });
});

// GET /shoes/:id — Read single shoe
app.get("/shoes/:id", (req, res) => {
    const shoeId = req.params.id;
    const q = "SELECT * FROM shoes WHERE id = ?";
    db.query(q, [shoeId], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        if (data.length === 0) return res.status(404).json({ error: "Shoe not found" });
        return res.status(200).json(buildProductResponse(data[0]));
    });
});

// POST /shoes — Create a shoe
app.post("/shoes", requireAuth, requireAdmin, (req, res) => {
    const { errors, values: normalizedValues } = validateProductPayload(req.body);
    if (errors.length > 0) {
        const messages = errors.map((item) => item.message);
        return res.status(400).json({
            error: messages.join(" "),
            message: "Validation failed.",
            errors,
        });
    }

    const q = "INSERT INTO shoes (`prod_name`, `prod_description`, `image`, `images_json`, `price`, `quantity`, `category`, `rating`) VALUES (?)";
    const sqlValues = [
        normalizedValues.prod_name,
        normalizedValues.prod_description,
        normalizedValues.image,
        normalizedValues.images_json,
        normalizedValues.price,
        normalizedValues.quantity,
        normalizedValues.category,
        normalizedValues.rating,
    ];
    db.query(q, [sqlValues], (err, data) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Database Error" });
        return res.status(201).json({ message: "Shoe added successfully!", id: data.insertId });
    });
});

// PUT /shoes/:id — Update a shoe
app.put("/shoes/:id", requireAuth, requireAdmin, (req, res) => {
    const shoeId = req.params.id;
    const { errors, values: normalizedValues } = validateProductPayload(req.body);
    if (errors.length > 0) {
        const messages = errors.map((item) => item.message);
        return res.status(400).json({
            error: messages.join(" "),
            message: "Validation failed.",
            errors,
        });
    }

    const q = "UPDATE shoes SET `prod_name`=?, `prod_description`=?, `image`=?, `images_json`=?, `price`=?, `quantity`=?, `category`=?, `rating`=? WHERE id=?";
    const sqlValues = [
        normalizedValues.prod_name,
        normalizedValues.prod_description,
        normalizedValues.image,
        normalizedValues.images_json,
        normalizedValues.price,
        normalizedValues.quantity,
        normalizedValues.category,
        normalizedValues.rating,
    ];
    db.query(q, [...sqlValues, shoeId], (err, data) => {
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

// ─── ORDERS Routes ─────────────────────────────────────────────────────────────

// POST /orders — Place a new order
app.post("/orders", requireAuth, async (req, res) => {
    if (req.auth.role === "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin accounts cannot place orders. Use a customer account as the buyer.",
        });
    }

    // Buyer must always be the authenticated user, not a userID supplied by the client.
    const payload = {
        ...req.body,
        userID: Number(req.auth.id),
        // Customer checkout always starts as Pending. Only admins can change status later.
        status: "Pending",
    };

    const { errors, values } = validateOrderPayload(payload);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors });
    }

    try {
        const hasUser = await userExists(values.userID);
        if (!hasUser) {
            return res.status(404).json({ success: false, message: "userID does not exist." });
        }

        const uniqueProductIds = [...new Set(values.items.map((item) => item.productID))];
        const products = await getProductsByIds(uniqueProductIds);
        if (products.length !== uniqueProductIds.length) {
            return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
        }

        const productPriceMap = new Map(products.map((product) => [product.id, Number(product.price)]));
        const calculatedTotal = values.items.reduce((sum, item) => {
            const unitPrice = productPriceMap.get(item.productID) || 0;
            return sum + unitPrice * item.quantity;
        }, 0);

        // Prevent mismatched totals by using server-side calculation as source of truth.
        const normalizedTotalAmount = Number(calculatedTotal.toFixed(2));

        const orderResult = await dbQuery(
            "INSERT INTO orders (user_id, status, total_amount, shipping_address) VALUES (?, ?, ?, ?)",
            [values.userID, values.status, normalizedTotalAmount, values.shippingAddress]
        );

        const orderID = orderResult.insertId;
        for (const item of values.items) {
            await dbQuery(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                [orderID, item.productID, item.quantity, productPriceMap.get(item.productID)]
            );
        }

        const createdOrderRows = await dbQuery("SELECT * FROM orders WHERE id = ?", [orderID]);
        const createdItems = await getOrderItems(orderID);
        return res.status(201).json({
            success: true,
            data: buildOrderResponse(createdOrderRows[0], createdItems),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.sqlMessage || "Database Error" });
    }
});

// GET /orders — Read orders (admin gets all, users get their own)
app.get("/orders", requireAuth, async (req, res) => {
    try {
        const isAdmin = req.auth.role === "admin";
        const orderRows = isAdmin
            ? await dbQuery("SELECT * FROM orders ORDER BY id DESC")
            : await dbQuery("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [req.auth.id]);

        const orders = [];
        for (const orderRow of orderRows) {
            const items = await getOrderItems(orderRow.id);
            orders.push(buildOrderResponse(orderRow, items));
        }

        return res.status(200).json({ success: true, data: orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.sqlMessage || "Database Error" });
    }
});

// GET /orders/:id — Read one order in detail
app.get("/orders/:id", requireAuth, async (req, res) => {
    const orderID = Number(req.params.id);
    if (!Number.isInteger(orderID) || orderID <= 0) {
        return res.status(400).json({ success: false, message: "Order id must be a positive integer." });
    }

    try {
        const rows = await dbQuery("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderID]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const order = rows[0];
        if (req.auth.role !== "admin" && Number(req.auth.id) !== Number(order.user_id)) {
            return res.status(403).json({ success: false, message: "You cannot access this order." });
        }

        const items = await getOrderItems(orderID);
        return res.status(200).json({ success: true, data: buildOrderResponse(order, items) });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.sqlMessage || "Database Error" });
    }
});

// PUT /orders/:id — Update order status/details
app.put("/orders/:id", requireAuth, async (req, res) => {
    const orderID = Number(req.params.id);
    if (!Number.isInteger(orderID) || orderID <= 0) {
        return res.status(400).json({ success: false, message: "Order id must be a positive integer." });
    }

    const { errors, values } = validateOrderPayload(req.body, { partial: true });
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors });
    }

    try {
        const rows = await dbQuery("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderID]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const currentOrder = rows[0];
        const isOwner = Number(req.auth.id) === Number(currentOrder.user_id);
        const isAdmin = req.auth.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "You cannot update this order." });
        }

        if (!isAdmin && req.body.status !== undefined) {
            return res.status(403).json({ success: false, message: "Only admins can update order status." });
        }

        const nextStatus = req.body.status !== undefined ? values.status : currentOrder.status;
        const nextShippingAddress =
            req.body.shippingAddress !== undefined ? values.shippingAddress : currentOrder.shipping_address;

        let nextTotalAmount = Number(currentOrder.total_amount);
        if (req.body.items !== undefined) {
            const uniqueProductIds = [...new Set(values.items.map((item) => item.productID))];
            const products = await getProductsByIds(uniqueProductIds);
            if (products.length !== uniqueProductIds.length) {
                return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
            }

            const productPriceMap = new Map(products.map((product) => [product.id, Number(product.price)]));
            nextTotalAmount = Number(
                values.items
                    .reduce((sum, item) => sum + (productPriceMap.get(item.productID) || 0) * item.quantity, 0)
                    .toFixed(2)
            );

            await dbQuery("DELETE FROM order_items WHERE order_id = ?", [orderID]);
            for (const item of values.items) {
                await dbQuery(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    [orderID, item.productID, item.quantity, productPriceMap.get(item.productID)]
                );
            }
        } else if (req.body.totalAmount !== undefined) {
            nextTotalAmount = values.totalAmount;
        }

        await dbQuery(
            "UPDATE orders SET status = ?, total_amount = ?, shipping_address = ? WHERE id = ?",
            [nextStatus, nextTotalAmount, nextShippingAddress, orderID]
        );

        const updatedRows = await dbQuery("SELECT * FROM orders WHERE id = ?", [orderID]);
        const updatedItems = await getOrderItems(orderID);
        return res.status(200).json({
            success: true,
            data: buildOrderResponse(updatedRows[0], updatedItems),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.sqlMessage || "Database Error" });
    }
});

// DELETE /orders/:id — Delete order and related items
app.delete("/orders/:id", requireAuth, async (req, res) => {
    const orderID = Number(req.params.id);
    if (!Number.isInteger(orderID) || orderID <= 0) {
        return res.status(400).json({ success: false, message: "Order id must be a positive integer." });
    }

    try {
        const rows = await dbQuery("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderID]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const order = rows[0];
        const isOwner = Number(req.auth.id) === Number(order.user_id);
        const isAdmin = req.auth.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "You cannot delete this order." });
        }

        await dbQuery("DELETE FROM orders WHERE id = ?", [orderID]);
        return res.status(200).json({ success: true, message: "Order deleted successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.sqlMessage || "Database Error" });
    }
});

// ─── Start Server ──────────────────────────────────────────────────────────────

app.listen(8800, () => {
    console.log("Backend running on http://localhost:8800");
});